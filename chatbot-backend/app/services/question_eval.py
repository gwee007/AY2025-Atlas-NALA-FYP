from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Any, Literal, List, Dict
from sqlalchemy.orm import Session
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
    reasoning: str = Field(description="Short reason to explain to the student directly your SOLO Level classification result based on the GRADING RUBRIC.")
    reference_material: str = Field(description="One sentence explicitly outlining the most relevant subtopic(s) and topic(s) crucial to answering this question.")
    relevant_subtopic_ids: List[int] = Field(description="List of subtopic IDs (as integers) from the provided context that are most relevant to answering this question.")
    relevant_topic_ids: List[int] = Field(description="List of topic IDs (as integers) corresponding to the selected subtopics.")

# ---------- question evaluation service -----------
class QuestionEvaluationService:
    def __init__(self, db_session: Session):
        self.llm = NalaGemini()
        self.rag = RAGService(db_session)
        
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
            top_k=3
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
        
        system_prompt = f"""Classify the student's question based on technical relevance to the specified course topics.
            
            COURSE TOPICS:
            {self.topics_list}

            Irrelevant questions are about exams, grades, deadlines, administrative, greetings, logistics, or off-topic matters.
            Relevant questions are about technical concepts ONLY within the course topics above.
                    
            {parser.get_format_instructions()}
        """

        user_prompt = f"Question: {question}"
        
        # Run LLM call in thread pool to avoid blocking event loop
        output = await asyncio.to_thread(
            self.llm.invoke,
            user_prompt,
            system_instruction=system_prompt
        )
        return parser.parse(output)

    async def _grade_solo_taxonomy(self, question: str, relevant_subtopics: List[Subtopic]) -> QuestionAssessment:
        parser = PydanticOutputParser(pydantic_object=QuestionAssessment)
        
        # concatenate relevant subtopics and its summaries into context string
        context_items = []
        for s in relevant_subtopics:
            context_items.append(
                f"- Subtopic ID: {s.id} | Topic ID: {s.topic_id} | Subtopic: {s.subtopic_name} | Topic: {s.topic.topic_name} | Subtopic Summary: {s.subtopic_summary}"
            )
        context_str = "\n".join(context_items)
        
        system_prompt = f"""
            You are a SOLO taxonomy classifier for a student's question.
            Classify based on the identified course topics and assign the corresponding grade with reasoning.
            From the provided context, suggest the most relevant reference material.

            GRADING RUBRIC:
            - Unistructural: Asks about a fact or definition. Grade: C
            - Multistructural: Asks about listing or describing multiple concepts of the same topic. Grade: B
            - Relational: Asks about causes, compares, analyzes, or integrates concepts from different topics. Grade: A
            - Extended Abstract: Generalizes or hypothesizes topic concepts to real-life industrial applications. Grade: A+

            OUTPUT REQUIREMENTS:
            - SOLO Level.
            - Grade.
            - Short Reason to explain to the student directly your SOLO Level classification result based on the GRADING RUBRIC.
            - Reference Material: One sentence to state which subtopic(s) and topic(s) materials are crucial to the question.
            - Relevant Subtopic IDs: Select the subtopic IDs from the context that are most relevant for answering this question.
            - Relevant Topic IDs: Select the corresponding topic IDs for each selected subtopic.

            {parser.get_format_instructions()}
        """

        user_prompt = f"""
            CONTEXT: {context_str}
            Question: {question}
        """

        # Run LLM call in thread pool to avoid blocking event loop
        output = await asyncio.to_thread(
            self.llm.invoke,
            user_prompt,
            system_instruction=system_prompt
        )
        return parser.parse(output)