from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from app.core.llm_client import NalaGemini
from app.services.rag_service import RAGService
from app.database.models import DocumentChunk
import asyncio

class ModelAnswer(BaseModel):
    suggested_answer: str = Field(description="A complete, correct, coherent, and concise answer to the student's question based on the reference material")

class AnswerGrading(BaseModel):
    accuracy_score: int = Field(description="Accuracy score from 0-100 based on the grading rubric")
    feedback: str = Field(description="Detailed constructive feedback explaining the accuracy score with strengths and suggestions for improvement")
    higher_order_questions: List[str] = Field(description="A list of higher-order, thought-provoking application questions related to the subtopics discussed to extend learning")

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
            relevant_chunks = self.rag.retrieve_document_chunks(
                question=question,
                relevant_subtopic_ids=relevant_subtopic_ids,
                top_k=5,
                rerank_top_k=3
            )
            
            # Stage 1: Generate model answer from reference material
            model_answer = await self._generate_model_answer(question, relevant_chunks)
            
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
                "higher_order_questions": answer_grading.higher_order_questions,
            }
        
        except Exception as e:
            raise RuntimeError(f"Error evaluating answer: {e}")
        
    # ---------- internal methods -----------

    async def _generate_model_answer(self, question: str, reference_chunks: List[DocumentChunk]) -> ModelAnswer:
        """
        Generate a complete model answer to the student's question based on reference material.
        """
        parser = PydanticOutputParser(pydantic_object=ModelAnswer)
        
        # prepare context from document chunks
        context_items = []
        for i, chunk in enumerate(reference_chunks, 1):
            context_items.append(
                f"Reference {i} - {chunk.subtopic.subtopic_name}:\n{chunk.content}"
            )
        
        context_str = "\n".join(context_items)
        
        system_prompt = f"""
        You are an expert in Process Control and Dynamics.
        Your task is to generate a complete, correct, coherent, and concise answer to the student's question using the provided reference material.
        
        {parser.get_format_instructions()}
        """
        
        user_prompt = f"""
        REFERENCE MATERIAL:
        {context_str}
        
        STUDENT'S QUESTION: {question}
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
                suggested_answer="I apologize, but I encountered an error while generating the model answer. Please refer to your course materials for guidance."
            )

    async def _grade_answer(self, solo_taxonomy_level: str, student_answer: str, model_answer: str) -> AnswerGrading:
        """
        Grade the student's answer against the model answer using the grading rubric.
        """
        parser = PydanticOutputParser(pydantic_object=AnswerGrading)
        
        system_prompt = f"""
        You are an expert evaluator for Process Control and Dynamics course material.
        Grade the student's answer by comparing it to the model answer using the grading rubric for the given SOLO taxonomy level of the question.

        GRADING RUBRIC:
        - Unistructural: 100% (correct) or 0% (wrong)
        - Multistructural or Relational:  Level 3 (correct and complete), Level 2 (incomplete but shows mastery of fundamental concepts), Level 1 (wrong and lacks fundamentals)
        - Extended Abstract: Level 3 (correct integration and synthesis of concepts to real-world contextual application), Level 2 (partial synthesis but lacks depth and context), Level 1 (fails to synthesise appropriately)

        OUTPUT REQUIREMENTS:
        - Accuracy Score (0-100) based on the grading rubric for the SOLO taxonomy level
        - Constructive feedback explicitly highlighting the strengths and suggestions for improvement (only if applicable) on the student's answer
        - A list of 1-2 higher-order application questions related to the subtopics discussed to extend learning
                
        {parser.get_format_instructions()}
        """
        
        user_prompt = f"""
        STUDENT QUESTION'S SOLO TAXONOMY LEVEL: {solo_taxonomy_level}
        
        MODEL ANSWER:
        {model_answer}
        
        STUDENT'S ANSWER:
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
                accuracy_score=50,
                feedback="I encountered an error while evaluating your answer. Please consult with your instructor for detailed feedback.",
                higher_order_questions=["Please review the relevant course materials and try again."]
            )