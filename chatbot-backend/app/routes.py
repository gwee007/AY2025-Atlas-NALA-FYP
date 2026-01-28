import traceback
from flask import Blueprint, request, jsonify
from sqlalchemy.orm import Session
from app.database.session import get_db_session, SessionLocal
from app.core.orchestrator import Orchestrator
from app.database.models import Conversation, Message, User
from dashboard_backend.redis_client import invalidate_all_caches
import logging
import asyncio

logger = logging.getLogger(__name__)

main_bp = Blueprint('main', __name__)

# handle db session cleanup
@main_bp.teardown_request
def shutdown_session(exception=None):
    SessionLocal.remove()

@main_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "Chatbot backend is running"}), 200


@main_bp.route('/api/verify-user/<string:user_id>', methods=['GET'])
def verify_user(user_id: str):
    """Verify if a user exists in the database."""
    db: Session = get_db_session()
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if user:
            return jsonify({"exists": True, "user_id": user_id}), 200
        else:
            return jsonify({"exists": False, "message": "User not found"}), 404
    
    except Exception as e:
        logger.error(f"Error verifying user: {e}")
        return jsonify({"error": "Failed to verify user"}), 500
    
    finally:
        db.close()


@main_bp.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat interactions: new questions and answers to pending questions."""
    db: Session = get_db_session()
    
    try:
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({"error": "Missing 'question' in request body"}), 400
        
        user_question = data.get('question')
        conversation_id = data.get('conversation_id')
        user_id = data.get('user_id', "2")  # Default to user_id="2" as string
        
        # Ensure user exists - user_id is now string
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
            # check conversation exists and belongs to the user
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id 
            ).first()

            # if no conversation found, return error
            if not conversation:
                return jsonify({"error": f"Conversation with id {conversation_id} not found"}), 404
            
            # Update title if it's still "New Chat" and this is the first user message
            if conversation.title == "New Chat":
                conversation.title = user_question[:50] + "..." if len(user_question) > 50 else user_question
                db.commit()
                logger.info(f"Updated conversation {conversation_id} title to: {conversation.title}")
        
        # Check if there's a pending question that needs an answer
        orchestrator = Orchestrator(db)
        pending_question = orchestrator.get_pending_question(conversation_id)
        
        # if there is a pending question, treat user input as answer
        if pending_question:
            result = asyncio.run(
                orchestrator.process_answer(
                    conversation_id=conversation_id,
                    question_id=pending_question.id,
                    user_answer=user_question
                )
            )
            
            response_data = {
                "response": result["chatbot_response"],
                "conversation_id": str(conversation_id),
                "user_message_id": result["user_message_id"],
                "chatbot_message_id": result["chatbot_message_id"],
                "answer_id": result["answer_id"],
                "accuracy_score": result["accuracy_score"],
                "evaluation_type": "ANSWER_EVALUATED"
            }
            
            return jsonify(response_data), 200
        
        # if no pending question, treat user input as a question
        else:
            # User is asking a new question
            result = asyncio.run(
                orchestrator.process_question(
                    conversation_id=conversation_id,
                    user_question=user_question
                )
            )
            
            # Invalidate cache immediately after question is processed and graded
            try:
                invalidate_all_caches(user_id)
                logger.info(f"Cache invalidated for user {user_id} after new question")
            except Exception as cache_error:
                logger.warning(f"Failed to invalidate cache for user {user_id}: {cache_error}")
                        
            response_data = {
                "response": result["chatbot_response"],
                "conversation_id": str(conversation_id),
                "user_message_id": result["user_message_id"],
                "chatbot_message_id": result["chatbot_message_id"],
                "evaluation_type": result["evaluation_type"]
            }
            
            if "question_id" in result:
                response_data["question_id"] = result["question_id"]
                response_data["metadata"] = result.get("metadata", {})
            
            return jsonify(response_data), 200
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500
    
    finally:
        db.close()


@main_bp.route('/api/conversations', methods=['GET'])
def get_conversations():
    """Get all conversations for a specific user."""
    db: Session = get_db_session()
    
    try:
        user_id = request.args.get('user_id', default="2", type=str)  # Accept as string
        
        # Only fetch conversations for the specified user
        conversations = db.query(Conversation).filter(
            Conversation.user_id == user_id  # Direct string comparison
        ).order_by(Conversation.last_accessed.desc()).all()
                
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
        logger.error(f"Error fetching conversations: {e}")
        return jsonify({"error": "Failed to fetch conversations"}), 500
    
    finally:
        db.close()


@main_bp.route('/api/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation with default title 'New Chat'."""
    db: Session = get_db_session()
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', "2")  # Default to user_id="2" as string
        
        # Ensure user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return jsonify({"error": f"User with id {user_id} not found"}), 404
        
        # Create new conversation with default title
        conversation = Conversation(
            user_id=user_id,
            title="New Chat"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        
        logger.info(f"Created new conversation {conversation.id} for user {user_id}")
        
        return jsonify({
            "id": conversation.id,
            "title": conversation.title,
            "last_accessed": conversation.last_accessed.isoformat(),
            "updated_at": conversation.last_accessed.isoformat()
        }), 201
    
    except Exception as e:
        logger.error(f"Error creating conversation: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to create conversation"}), 500
    
    finally:
        db.close()


@main_bp.route('/api/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id: int):
    """
    Get all messages for a specific conversation.
    Returns list of messages in chronological order.
    SECURITY: Validates that the conversation belongs to the requesting user.
    """
    db: Session = get_db_session()
    
    try:
        user_id = request.args.get('user_id', default="2", type=str)  # Accept as string
        
        # Check conversation exists and belongs to the user
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id  # Direct string comparison
        ).first()

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
