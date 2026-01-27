from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Any, Literal, List, Dict
from app.core.llm_client import NalaGemini
from app.services.rag_service import RAGService
from app.database.models import Subtopic
import asyncio

# ---------- pydantic models -----------
class RelevanceAssessment(BaseModel):
    is_technical: bool = Field(description="True only if the question is about technical course concepts in the listed topics under Process Control and Dynamics.")

class QuestionAssessment(BaseModel):
    solo_level: Literal["Unistructural", "Multistructural", "Relational", "Extended Abstract"]
    grade: Literal["C", "B", "A", "A+"]
    reasoning: str = Field(description="Short concise reason to explain to the student directly your SOLO Level classification result using ONLY the terminology from the GRADING RUBRIC and mention of relevant topics/subtopics.")
    reference_material: str = Field(description="One sentence explicitly outlining the most relevant subtopic(s) and topic(s) crucial to answering this question.")
    relevant_subtopic_ids: List[int] = Field(description="List of subtopic IDs (as integers) from the provided context that are most relevant to answering this question.")
    relevant_topic_ids: List[int] = Field(description="List of topic IDs (as integers) corresponding to the selected subtopics.")

# ---------- question evaluation service -----------
class QuestionEvaluationService:
    def __init__(self, llm_client: NalaGemini, rag_service: RAGService):
        """
        Initialize QuestionEvaluationService with shared dependencies.
        """
        self.llm = llm_client
        self.rag = rag_service
        
        self.topics_list = """
        - Introduction to Process Control
        - Theoretical Models of Chemical Processes
        - Laplace Transforms
        - Transfer Functions
        - Dynamic Behaviour of First Order and Second Order Processes
        - Dynamic Response Characteristics of More Complicated Processes
        """

    async def evaluate_question(self, user_question: str) -> Dict[str, Any]:
        """
        Entire question evaluation pipeline.
        Returns a standardized dict with evaluation type and metadata
        """
        
        # step 1: technical relevance check to given course topics
        relevance = await self._check_relevance(user_question)
        
        if not relevance.is_technical:
            return {
                "type": "IRRELEVANT",
                "topics_list": self.topics_list
            }

        # step 2: retrieve context from relevant subtopic summaries (high-level)
        relevant_subtopics = await asyncio.to_thread(
            self.rag.retrieve_subtopics,
            user_question,
            5  # top_k
        )
        
        # step 3: solo taxonomy grading using retrieved subtopics as context
        solo_assessment = await self._grade_solo_taxonomy(user_question, relevant_subtopics)

        return {
            "type": "QUESTION_GRADED",
            "solo_level": solo_assessment.solo_level,
            "grade": solo_assessment.grade,
            "reasoning": solo_assessment.reasoning,
            "reference_material": solo_assessment.reference_material,
            "relevant_subtopic_ids": solo_assessment.relevant_subtopic_ids,
            "relevant_topic_ids": solo_assessment.relevant_topic_ids,
            "retrieved_subtopic_ids": [s.id for s in relevant_subtopics]
        }

    # ---------- internal methods -----------

    async def _check_relevance(self, question: str) -> RelevanceAssessment:
        parser = PydanticOutputParser(pydantic_object=RelevanceAssessment)

        system_prompt = f"""
            You are a technical relevance classifier for a student's question.
            Determine if the question is TECHNICALLY RELEVANT to the Process Control and Dynamics course topics provided below.

            TECHNICALLY RELEVANT Questions:
            - Questions about technical concepts, principles, models, methods, reasoning, or process control applications strictly within the provided course topics.
            
            TECHNICALLY IRRELEVANT Questions:
            - Exams, grades, deadlines, logistics, administration, greetings, study advice, or any topic beyond the scope of the provided course topics.
            - Real-world applications that are too general, vague, or unrelated to process control and dynamics scenarios.
            
            COURSE TOPICS (authoritative scope):
            {self.topics_list}

            {parser.get_format_instructions()}
            """
        user_prompt = f"STUDENT'S QUESTION: {question}"
        
        try:
            # Run LLM call in thread pool to avoid blocking event loop
            output = await asyncio.to_thread(
                self.llm.invoke,
                user_prompt,
                system_instruction=system_prompt
            )
            return parser.parse(output)
        except Exception as e:
            # Return irrelevant if parsing fails to prevent duplicate responses
            return RelevanceAssessment(is_technical=False)

    async def _grade_solo_taxonomy(self, question: str, relevant_subtopics: List[Subtopic]) -> QuestionAssessment:
        parser = PydanticOutputParser(pydantic_object=QuestionAssessment)
        
        # concatenate relevant subtopics and its summaries into context string
        context_str = "\n".join(
            f"- Subtopic ID: {s.id} | Topic ID: {s.topic_id} | Subtopic: {s.subtopic_name} | Topic: {s.topic.topic_name} | Subtopic Summary: {s.subtopic_summary}"
            for s in relevant_subtopics
        )
        
        system_prompt = f"""
            You are a SOLO taxonomy classifier for a student's question.
            Classify based on the identified course material and assign the corresponding grade with reasoning.
            From the provided context, suggest the most relevant reference material.

            GRADING RUBRIC:
            - Unistructural: Asks about a fact or definition. Grade: C
            - Multistructural: Asks about listing or describing multiple concepts of the same topic. Grade: B
            - Relational: Asks about causes, compares, analyzes, or integrates concepts from different topics. Grade: A
            - Extended Abstract: Asks about application of topic concepts to appropriate real-world industrial chemical engineering scenarios. Grade: A+

            OUTPUT REQUIREMENTS:
            - SOLO Level.
            - Grade.
            - Short Concise Reason: Explain to the student your SOLO Level classification using ONLY the terminology from the GRADING RUBRIC above and mention of relevant topics/subtopics. DO NOT reveal any actual concepts, definitions, or answer content from the material.
            - Reference Material: One sentence to explicitly state which topics followed by its subtopic(s) materials are crucial to the question. DO NOT reveal any answer content from the material.
            - Relevant Subtopic IDs: Select the subtopic IDs from the context that are most relevant for answering this question.
            - Relevant Topic IDs: Select the corresponding topic IDs for each selected subtopic.

            {parser.get_format_instructions()}
        """
        
        user_prompt = f"""
            CONTEXT: {context_str}
            STUDENT'S QUESTION: {question}
        """

        try:
            # Run LLM call in thread pool to avoid blocking event loop
            output = await asyncio.to_thread(
                self.llm.invoke,
                user_prompt,
                system_instruction=system_prompt
            )
            return parser.parse(output)
        except Exception as e:
            # Return default assessment if parsing fails
            topic_ids = list(set([s.topic_id for s in relevant_subtopics]))
            subtopic_ids = [s.id for s in relevant_subtopics]
            return QuestionAssessment(
                solo_level="Unistructural",
                grade="C",
                reasoning="Unable to classify question due to processing error.",
                reference_material="Please refer to the course materials.",
                relevant_subtopic_ids=subtopic_ids,
                relevant_topic_ids=topic_ids
            )