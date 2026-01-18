from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.core.orchestrator import Orchestrator
from app.database.models import Conversation, Message, User
import logging
import asyncio

logger = logging.getLogger(__name__)

main_bp = Blueprint('main', __name__)


@main_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "Chatbot backend is running"}), 200


@main_bp.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint that processes user questions and answers.
    
    Expected JSON body:
    {
        "question": "user's question text",
        "conversation_id": "conversation_id" (optional, will create new if not provided),
        "user_id": 1 (optional, defaults to 1)
    }
    
    Returns:
    {
        "response": "formatted chatbot response",
        "conversation_id": "conversation_id",
        "question_id": question_id (if question was graded),
        "evaluation_type": "QUESTION_GRADED" or "IRRELEVANT"
    }
    """
    db: Session = SessionLocal()
    
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' in request body"}), 400
        
        user_question = data.get('question')
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id', 1)  # Default to user 1
        
        # Ensure user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": f"User with id {user_id} not found"}), 404
        
        # Create new conversation only on first user message (when conversation_id is not provided)
        if not conversation_id:
            conversation = Conversation(
                user_id=user_id,
                title=user_question[:50] + "..." if len(user_question) > 50 else user_question
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            conversation_id = conversation.id
            logger.info(f"Created new conversation {conversation_id} for user {user_id}")
        else:
            # Verify conversation exists
            conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if not conversation:
                return jsonify({"error": f"Conversation with id {conversation_id} not found"}), 404
        
        # Check if there's a pending question that needs an answer
        orchestrator = Orchestrator(db)
        pending_question = orchestrator.get_pending_question(conversation_id)
        
        if pending_question:
            # User is providing an answer to the pending question
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                orchestrator.process_answer(
                    conversation_id=conversation_id,
                    question_id=pending_question.id,
                    user_answer=user_question
                )
            )
            loop.close()
            
            return jsonify({
                "response": result["chatbot_response"],
                "conversation_id": str(conversation_id),
                "answer_id": result["answer_id"],
                "accuracy_score": result["accuracy_score"],
                "evaluation_type": "ANSWER_EVALUATED"
            }), 200
        
        else:
            # User is asking a new question
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                orchestrator.process_question(
                    conversation_id=conversation_id,
                    user_question=user_question
                )
            )
            loop.close()
            
            response_data = {
                "response": result["chatbot_response"],
                "conversation_id": str(conversation_id),
                "evaluation_type": result["evaluation_type"]
            }
            
            if "question_id" in result:
                response_data["question_id"] = result["question_id"]
                response_data["metadata"] = result.get("metadata", {})
            
            return jsonify(response_data), 200
    
    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        return jsonify({"error": str(ve)}), 400
    
    except RuntimeError as re:
        logger.error(f"Runtime error in chat endpoint: {re}")
        return jsonify({"error": "Failed to process request"}), 500
    
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
    finally:
        db.close()


@main_bp.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations for a user."""
    db: Session = SessionLocal()
    
    try:
        user_id = request.args.get('user_id', 1, type=int)
        logger.info(f"Fetching conversations for user_id={user_id}")
        
        conversations = db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(Conversation.last_accessed.desc()).all()
        
        logger.info(f"Successfully retrieved {len(conversations)} conversations for user {user_id}")
        
        return jsonify([
            {
                "id": conv.id,
                "title": conv.title,
                "last_accessed": conv.last_accessed.isoformat(),
                "updated_at": conv.last_accessed.isoformat()
            }
            for conv in conversations
        ]), 200
    
    except Exception as e:
        logger.error(f"Error fetching conversations for user {user_id}: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to fetch conversations. Check server logs for details."}), 500
    
    finally:
        db.close()


@main_bp.route('/api/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id: int):
    """
    Get all messages for a specific conversation.
    
    Returns list of messages in chronological order.
    """
    db: Session = SessionLocal()
    
    try:
        # Verify conversation exists
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp.asc()).all()
        
        return jsonify([
            {
                "id": msg.id,
                "sender": msg.sender,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]), 200
    
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return jsonify({"error": "Failed to fetch messages"}), 500
    
    finally:
        db.close()
