from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session, joinedload
from app.services.question_eval import QuestionEvaluationService
from app.services.answer_eval import AnswerEvaluationService
from app.database.models import Message, Question, Answer, Topic, Subtopic
import logging

logger = logging.getLogger(__name__)


class Orchestrator:
    """
    Orchestrates the question and answer evaluation workflow.
    Manages database operations for questions, answers, and their relationships.
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.question_eval_service = QuestionEvaluationService(db_session)
        self.answer_eval_service = AnswerEvaluationService(db_session)
    
    def close_session(self) -> None:
        """
        Close the database session.
        Should be called after all operations are complete.
        """
        try:
            if self.db:
                self.db.close()
                logger.info("Database session closed successfully")
        except Exception as e:
            logger.error(f"Error closing database session: {e}")
    
    async def process_question(
        self, 
        conversation_id: int,
        user_question: str
    ) -> Dict[str, Any]:
        """
        Process a user's question through the evaluation pipeline.
        
        Flow:
        1. Evaluate question using QuestionEvaluationService
        2. If technically relevant, insert into database (messages, questions, question_topics, question_subtopics)
        3. Return formatted response with evaluation results
            
        Returns a dict:
            - chatbot_response: The message content to display to the user
            - question_id: ID of the stored question (if relevant)
            - evaluation_type: "IRRELEVANT" or "QUESTION_GRADED"
        """
        try:
            # step 1: evaluate the question
            question_evaluation_result = await self.question_eval_service.evaluate_question(user_question)
            
            # step 2: insert user question message
            user_message = Message(
                conversation_id=conversation_id,
                sender="user",
                content=user_question
            )
            self.db.add(user_message)
            self.db.flush()  # Get the message ID
            
            # step 3: format response based on evaluation type
            if question_evaluation_result["type"] == "IRRELEVANT":
                question_eval_response = (
                    "Sorry, I can only assist with technical course concept questions covered within "
                    "the specific topics of Process Control and Dynamics. For administrative or other "
                    "matters, please check with Dr Mukta Bansal. Please try asking a technical "
                    f"content-related question within these topics: {question_evaluation_result['topics_list']}"
                )
                
                response_data = {
                    "chatbot_response": question_eval_response,
                    "evaluation_type": question_evaluation_result["type"],
                    "user_message_id": user_message.id
                }
            
            else:  # QUESTION_GRADED
                footer_message = (
                    "\n\n---\n"
                    "Note: Please attempt to answer the question with the provided materials. "
                    "If you would like to ask a new question instead, it is recommended that "
                    "you create a new conversation for easier reference in the future."
                )
                
                # format chatbot response
                question_eval_response = (
                    "I have evaluated your question based on the SOLO taxonomy! Here are the details:\n\n"
                    f"**SOLO Taxonomy Level:** {question_evaluation_result['solo_level']}\n\n"
                    f"**Grade:** {question_evaluation_result['grade']}\n\n"
                    f"**Feedback:**\n{question_evaluation_result['reasoning']}\n\n"
                    f"**Relevant Reference Material:**\n{question_evaluation_result['reference_material']}"
                    f"{footer_message}"
                )
                
                # step 4: create question record
                question = Question(
                    message_id=user_message.id,
                    solo_taxonomy_level=question_evaluation_result["solo_level"],
                    grade=question_evaluation_result["grade"],
                    reasoning=question_evaluation_result["reasoning"],
                    status="AWAITING_ANSWER"
                )
                self.db.add(question)
                self.db.flush()  # Get the question ID
                
                # link topics using relationships (automatically populates question_topics table)
                if question_evaluation_result.get("relevant_topic_ids"):
                    topics = self.db.query(Topic).filter(
                        Topic.id.in_(question_evaluation_result["relevant_topic_ids"])
                    ).all()
                    question.topics.extend(topics)
                
                # link subtopics using relationships (automatically populates question_subtopics table)
                if question_evaluation_result.get("relevant_subtopic_ids"):
                    subtopics = self.db.query(Subtopic).filter(
                        Subtopic.id.in_(question_evaluation_result["relevant_subtopic_ids"])
                    ).all()
                    question.subtopics.extend(subtopics)
                
                # only include metadata and question_id for QUESTION_GRADED
                response_data = {
                    "chatbot_response": question_eval_response,
                    "evaluation_type": question_evaluation_result["type"],
                    "user_message_id": user_message.id,
                    "question_id": question.id,
                    "metadata": {
                        "solo_level": question_evaluation_result["solo_level"],
                        "grade": question_evaluation_result["grade"],
                        "reasoning": question_evaluation_result["reasoning"],
                        "reference_material": question_evaluation_result["reference_material"],
                        "relevant_subtopic_ids": question_evaluation_result["relevant_subtopic_ids"],
                        "relevant_topic_ids": question_evaluation_result["relevant_topic_ids"],
                        "retrieved_subtopic_ids": question_evaluation_result["retrieved_subtopic_ids"]
                    }
                }
                
                logger.info(f"Question {question.id} created and linked to conversation {conversation_id}")
            
            # step 5: insert chatbot response message
            chatbot_message = Message(
                conversation_id=conversation_id,
                sender="bot",
                content=question_eval_response
            )
            self.db.add(chatbot_message)
            self.db.commit()
            
            # append chatbot message ID regardless of technical relevance of question
            response_data["chatbot_message_id"] = chatbot_message.id
            
            return response_data
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing question: {e}")
            raise RuntimeError(f"Failed to process question: {e}")
        finally:
            self.close_session()
    
    async def process_answer(
        self,
        conversation_id: int,
        question_id: int,
        user_answer: str
    ) -> Dict[str, Any]:
        """
        Process a user's answer through the evaluation pipeline.
        
        1. Retrieve the associated question from database
        2. Evaluate answer using answer_eval.py
        3. Insert answer into database with evaluation results
        4. Update question status to "ANSWERED"
        """
        try:
            # step 1: retrieve question text given question_id
            question = (
                self.db.query(Question)
                .options(
                    joinedload(Question.message),
                    joinedload(Question.subtopics)
                )
                .filter(Question.id == question_id)
                .one_or_none()
            )
            
            if not question:
                raise ValueError(f"Question with ID {question_id} not found")
            
            if str(question.status) == "ANSWERED":
                logger.warning(f"Question {question_id} has already been answered")
            
            # get relevant subtopic IDs from the question
            relevant_subtopic_ids = [subtopic.id for subtopic in question.subtopics]
            
            # step 2: insert user answer message
            user_message = Message(
                conversation_id=conversation_id,
                sender="user",
                content=user_answer
            )
            self.db.add(user_message)
            self.db.flush()
            
            # step 3: evaluate the answer
            evaluation_result = await self.answer_eval_service.evaluate_answer(
                question=question.message.content,
                solo_taxonomy_level=str(question.solo_taxonomy_level),
                student_answer=user_answer,
                relevant_subtopic_ids=relevant_subtopic_ids
            )
            
            # step 4: create answer record
            answer = Answer(
                message_id=user_message.id,
                question_id=question_id,
                accuracy_score=evaluation_result["accuracy_score"],
                feedback=evaluation_result["feedback"]
            )
            self.db.add(answer)
            
            # step 5: update question status to ANSWERED 
            self.db.query(Question).filter(Question.id == question_id).update({"status": "ANSWERED"})
            
            # format chatbot response
            answer_eval_response = (
                "Thank you for attempting to answer the question! Here is the evaluation of your answer:\n\n"
                f"**Accuracy Score (out of 100):** {evaluation_result['accuracy_score']}\n\n"
                f"**Feedback:**\n{evaluation_result['feedback']}\n\n"
                f"**Suggested Answer:**\n{evaluation_result['suggested_answer']}\n\n"
                f"**List of higher-order thinking questions related to the topics:**\n"
                + "\n".join([f"- {q}" for q in evaluation_result['higher_order_questions']])
            )
            
            # step 6: insert chatbot response message
            chatbot_message = Message(
                conversation_id=conversation_id,
                sender="bot",
                content=answer_eval_response
            )
            self.db.add(chatbot_message)
            self.db.commit()
            
            logger.info(f"Answer {answer.id} created for question {question_id}")
            
            return {
                "chatbot_response": answer_eval_response,
                "answer_id": answer.id,
                "user_message_id": user_message.id,
                "chatbot_message_id": chatbot_message.id,
                "accuracy_score": evaluation_result["accuracy_score"],
                "feedback": evaluation_result["feedback"],
                "suggested_answer": evaluation_result["suggested_answer"],
                "higher_order_questions": evaluation_result["higher_order_questions"]
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing answer: {e}")
            raise RuntimeError(f"Failed to process answer: {e}")
        finally:
            self.close_session()

    def get_pending_question(self, conversation_id: int) -> Optional[Question]:
        """
        Retrieve the most recent unanswered question in a conversation.
        """
        try:
            question = (
                self.db.query(Question)
                .join(Message)
                .filter(Message.conversation_id == conversation_id)
                .filter(Question.status == "AWAITING_ANSWER")
                .order_by(Question.created_at.desc())
                .first()
            )
            return question
            
        except Exception as e:
            logger.error(f"Error retrieving pending question: {e}")
            return None