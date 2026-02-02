from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from app.core.llm_client import NalaGemini
from app.services.rag_service import RAGService
from app.database.models import DocumentChunk
import asyncio

class ModelAnswer(BaseModel):
    reasoning_trace: str = Field(description="Reasoning trace explaining how the reference material was used to derive the answer, aligned with the required SOLO taxonomy level.")
    suggested_answer: str = Field(description="Suggested answer to the student's question based on the reference material and SOLO taxonomy level criteria.")

class AnswerGrading(BaseModel):
    accuracy_score: int = Field(description="Accuracy score from 0-100 based on the grading rubric")
    feedback: str = Field(description="Constructive feedback explaining the accuracy score with strengths and suggestions for improvement")
    higher_order_concepts: List[str] = Field(description="A list of higher-order concepts (should be of next higher SOLO taxonomy level or deeper relevant application questions) related to the subtopics discussed to extend learning")

class AnswerEvaluationService:
    def __init__(self, llm_client: NalaGemini, rag_service: RAGService):
        """
        Initialize AnswerEvaluationService with shared dependencies.
        
        Args:
            llm_client: Shared LLM client instance
            rag_service: Shared RAG service instance
        """
        self.llm = llm_client
        self.rag = rag_service

    async def evaluate_answer(self, question: str, solo_taxonomy_level: str, student_answer: str, relevant_subtopic_ids: List[int]) -> Dict[str, Any]:
        """
        Evaluate a student's answer based on retrieved context from relevant subtopic document chunks.
        Returns standardized dict with evaluation results.
        """
        try:
            # retrieve relevant document chunks for context
            relevant_chunks = await asyncio.to_thread(
                self.rag.retrieve_document_chunks,
                question=question,
                relevant_subtopic_ids=relevant_subtopic_ids,
                top_k=5,
                rerank_top_k=3
            )
            
            # Stage 1: Generate model answer from reference material with COT
            model_answer = await self._generate_model_answer(question, relevant_chunks, solo_taxonomy_level)
            
            # Stage 2: Grade student's answer using LLM model answer and grading rubric
            answer_grading = await self._grade_answer(
                solo_taxonomy_level=solo_taxonomy_level,
                student_answer=student_answer,
                model_answer=model_answer.suggested_answer
            )
            
            return {
                "accuracy_score": answer_grading.accuracy_score,
                "feedback": answer_grading.feedback,
                "suggested_answer": model_answer.suggested_answer,
                "reasoning_trace": model_answer.reasoning_trace,
                "higher_order_concepts": answer_grading.higher_order_concepts,
            }
        
        except Exception as e:
            raise RuntimeError(f"Error evaluating answer: {e}")
        
    # ---------- internal methods -----------

    async def _generate_model_answer(self, question: str, reference_chunks: List[DocumentChunk], solo_taxonomy_level: str) -> ModelAnswer:
        """
        Generate a complete model answer to the student's question based on reference material.
        Includes a reasoning trace based on the SOLO taxonomy level.
        """
        parser = PydanticOutputParser(pydantic_object=ModelAnswer)
        
        # prepare context from document chunks
        context_str = "\n".join(
            f"Reference {i} - {chunk.subtopic.subtopic_name}:\n{chunk.content}"
            for i, chunk in enumerate(reference_chunks, 1)
        )
        
        system_prompt = f"""
        You are an expert in Process Control and Dynamics.
        
        You must follow a two-step internal process:
        1. First, reason step-by-step using the reference material to determine what constitutes a correct and appropriate answer at the required SOLO taxonomy level.
        2. Then, based on this reasoning, generate the final context-aware suggested answer.

        SOLO TAXONOMY LEVEL GUIDELINES (use to guide reasoning and answer construction):
        - Unistructural: Identify and define the single relevant fact or concept or definition from the reference material.
        - Multistructural: Identify, list, and describe multiple distinct concepts or steps from the reference material.
        - Relational: Integrate and explain relationships between multiple concepts from the reference material to form a coherent explanation.
        - Extended Abstract: Synthesize and apply relevant concepts from the reference material to the real-world contextual scenario described in the question.

        FORMATTING REQUIREMENTS:
        - **Always use LaTeX notation for all mathematical expressions, equations, and formulas**
        - Inline math: wrap in single dollar signs $expression$
        - Block math equations: wrap in double dollar signs $$equation$$

        OUTPUT REQUIREMENTS:
        - Reasoning Trace: Give a concise and clear explanation of how you selected and synthesized information from the reference material to construct the answer. Use LaTeX for all mathematical expressions.
        - Suggested Answer: The final continuous, well-formed answer explicitly derived from the reasoning trace. Use LaTeX for all mathematical expressions.
        
        {parser.get_format_instructions()}
        """
        
        user_prompt = f"""
        REFERENCE MATERIAL:
        {context_str}
        
        STUDENT'S QUESTION: {question}
        REQUIRED SOLO TAXONOMY LEVEL: {solo_taxonomy_level}
        """
        
        try:
            output = await asyncio.to_thread(
                self.llm.invoke,
                user_prompt,
                system_instruction=system_prompt
            )
            return parser.parse(output)
        except Exception as e:
            # Return default model answer if parsing fails
            return ModelAnswer(
                reasoning_trace=f"Based on the reference material provided about {solo_taxonomy_level} level concepts, I've synthesized the key information relevant to your question.",
                suggested_answer=f"Based on the course materials on {reference_chunks[0].subtopic.subtopic_name if reference_chunks else 'this topic'}, here are the key points to consider. Please refer to your lecture notes for additional details and examples."
            )

    async def _grade_answer(self, solo_taxonomy_level: str, student_answer: str, model_answer: str) -> AnswerGrading:
        """
        Grade the student's answer against the model answer using the grading rubric.
        """
        parser = PydanticOutputParser(pydantic_object=AnswerGrading)
        
        system_prompt = f"""
        You are an expert evaluator for Process Control and Dynamics course.
        
        IMPORTANT: First check if the student input is a question rather than an answer attempt.
        If the student input is clearly a question (contains question words, question marks, or is phrased as an inquiry):
        - Assign a score of 0
        - Provide feedback explaining that they submitted a question instead of an answer, which results in a 0 score
        - Encourage them to review the suggested answer and reasoning trace to understand how the question should be answered
        - Still provide higher-order concepts to extend their learning
        - End the assessment (do NOT ask them to resubmit or try again)
        
        Otherwise, grade the student's answer by comparing it to the suggested answer using the grading rubric for the given SOLO taxonomy level of the question.

        GRADING RUBRIC (use to compute accuracy_score 0-100):
        - Unistructural: 100 (correct answer) or 0 (wrong answer or question submitted)
        - Multistructural or Relational: 
            - 90-100: Complete and accurate answer covering all key concepts
            - 70-90: Mostly correct answer (approximately 70% or more of expected content is accurate)
            - 40-50: Incomplete answer but shows the right direction and understanding of some fundamental concepts
            - 1-30: Completely wrong answer or demonstrates fundamental misunderstanding
            - 0: Question submitted instead of answer
        - Extended Abstract: 
            - 90-100: Complete and accurate answer that correctly integrates and synthesizes concepts to explain real-world contextual application
            - 70-90: Mostly correct synthesis (approximately 70% or more accurate) but may lack some depth or miss minor connections
            - 40-50: Incomplete synthesis but demonstrates right direction with partial understanding of how concepts apply
            - 1-30: Completely wrong or fails to demonstrate appropriate synthesis and application of concepts
            - 0: Question submitted instead of answer

        FORMATTING REQUIREMENTS:
        - **Always use LaTeX notation for all mathematical expressions, equations, and formulas**
        - Inline math: wrap in single dollar signs $expression$
        - Block math equations: wrap in double dollar signs $$equation$$

        OUTPUT REQUIREMENTS:
        - Accuracy Score (0-100) based on the grading rubric for the SOLO taxonomy level
        - Constructive feedback: 
            - If a question was submitted: Explain that asking a question instead of answering results in 0 score. Encourage them to review the suggested answer and reasoning trace to learn how to approach similar questions in the future. Conclude the assessment session.
            - If it's an answer attempt: Provide normal evaluation feedback with strengths and suggestions for improvement. Use LaTeX for all mathematical expressions.
        - Higher-order concepts: A suggested list of well-phrased 1-2 higher-order concepts that extend learning beyond the current SOLO taxonomy level related to the subtopics discussed. Provide this regardless of whether they submitted a question or answer. Use LaTeX for all mathematical expressions.
        
        {parser.get_format_instructions()}
        """
        
        user_prompt = f"""
        STUDENT QUESTION'S SOLO TAXONOMY LEVEL: {solo_taxonomy_level}
        
        SUGGESTED ANSWER:
        {model_answer}
        
        STUDENT'S INPUT (check if this is a question or an answer attempt):
        {student_answer}
        """
        
        try:
            output = await asyncio.to_thread(
                self.llm.invoke,
                user_prompt,
                system_instruction=system_prompt
            )
            return parser.parse(output)
        except Exception as e:
            # Return default grading if parsing fails
            return AnswerGrading(
                accuracy_score=0,
                feedback="I encountered an error while evaluating your input. Please review the suggested answer and reasoning trace provided to understand how to approach this question.",
                higher_order_concepts=["Consider exploring related concepts in your course materials for deeper understanding."]
            )