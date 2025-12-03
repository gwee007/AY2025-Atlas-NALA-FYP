"""
Simplified database connection and operations for the chatbot ER diagram structure.
"""

import os
import json, pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer
from datetime import datetime

# Load environment variables
load_dotenv()

# Create a local engine instead 
engine = create_engine('sqlite:///nala_simple.db', echo=False)
Base.metadata.create_all(engine)
Session = sessionmaker (bind=engine)
session= scoped_session(Session)

def json_to_data(json_data):
    """Convert JSON data to database entries"""
    data = json.load(json_data)
    df = pd.DataFrame(data)
    # Future work to be done.
    return df

# Get database URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/nala_simple')

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Session = scoped_session(SessionLocal)


def init_db():
    """Initialize database by creating all tables"""
    print("Creating simplified database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Simplified database tables created successfully!")
    print("\nTables created:")
    print("  - chatbot (ROOT_OBJECT)")
    print("  - user")
    print("  - conversation")
    print("  - message")
    print("  - question")
    print("  - answer")


def get_db_session():
    """Get a database session"""
    return Session()


def close_db():
    """Close all database connections"""
    Session.remove()
    engine.dispose()


# ========== CHATBOT OPERATIONS ==========

def create_chatbot():
    """Create a new chatbot (ROOT_OBJECT)"""
    db = get_db_session()
    try:
        chatbot = Chatbot(users_count=0)
        db.add(chatbot)
        db.commit()
        db.refresh(chatbot)
        print(f"✅ Created chatbot with ID: {chatbot.chatbot_id}")
        return chatbot.chatbot_id
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating chatbot: {e}")
        return None
    finally:
        db.close()


def get_chatbot(chatbot_id):
    """Get chatbot with all nested data (users -> conversations -> messages)"""
    db = get_db_session()
    try:
        chatbot = db.query(Chatbot).filter(Chatbot.chatbot_id == chatbot_id).first()
        if chatbot:
            return chatbot.to_dict()
        return None
    finally:
        db.close()


# ========== USER OPERATIONS ==========

def create_user(chatbot_id):
    """Create a new user under a chatbot"""
    db = get_db_session()
    try:
        user = User(chatbot_id=chatbot_id, conversations_count=0)
        db.add(user)
        
        # Update chatbot users_count
        chatbot = db.query(Chatbot).filter(Chatbot.chatbot_id == chatbot_id).first()
        if chatbot:
            chatbot.users_count += 1
        
        db.commit()
        db.refresh(user)
        print(f"✅ Created user with ID: {user.user_id}")
        return user.user_id
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating user: {e}")
        return None
    finally:
        db.close()


def get_user(user_id):
    """Get user with all conversations and messages"""
    db = get_db_session()
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if user:
            return user.to_dict()
        return None
    finally:
        db.close()


# ========== CONVERSATION OPERATIONS ==========

def create_conversation(user_id, title):
    """Create a new conversation for a user"""
    db = get_db_session()
    try:
        conversation = Conversation(
            user_id=user_id,
            title=title,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(conversation)
        
        # Update user conversations_count
        user = db.query(User).filter(User.user_id == user_id).first()
        if user:
            user.conversations_count += 1
        
        db.commit()
        db.refresh(conversation)
        print(f"✅ Created conversation with ID: {conversation.id}")
        return conversation.id
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating conversation: {e}")
        return None
    finally:
        db.close()


def get_conversation(conversation_id):
    """Get conversation with all messages"""
    db = get_db_session()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            return conv.to_dict()
        return None
    finally:
        db.close()


def update_conversation_timestamp(conversation_id):
    """Update the updated_at timestamp for a conversation"""
    db = get_db_session()
    try:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            conv.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating conversation: {e}")
        return False
    finally:
        db.close()


# ========== MESSAGE OPERATIONS ==========

def create_message(conversation_id, sender, content, metadata=None):
    """Create a new message in a conversation"""
    db = get_db_session()
    try:
        message = Message(
            conversation_id=conversation_id,
            sender=sender,
            content=content,
            timestamp=datetime.utcnow(),
            metadata=metadata
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Update conversation timestamp
        update_conversation_timestamp(conversation_id)
        
        print(f"✅ Created message with ID: {message.message_id}")
        return message.message_id
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating message: {e}")
        return None
    finally:
        db.close()


def get_messages(conversation_id):
    """Get all messages for a conversation"""
    db = get_db_session()
    try:
        messages = db.query(Message).filter(Message.conversation_id == conversation_id).all()
        return [msg.to_dict() for msg in messages]
    finally:
        db.close()


# ========== QUESTION OPERATIONS ==========

def create_question(message_id, topic_id=None, grade=None, feedback=None, 
                   solo_taxonomy_label=None, duration=None):
    """Create a new question linked to a message"""
    db = get_db_session()
    try:
        question = Question(
            message_id=message_id,
            topic_id=topic_id,
            grade=grade,
            feedback=feedback,
            solo_taxonomy_label=solo_taxonomy_label,
            duration=duration
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        print(f"✅ Created question with ID: {question.question_id}")
        return question.question_id
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating question: {e}")
        return None
    finally:
        db.close()


def get_question(question_id):
    """Get question with its answer (if exists)"""
    db = get_db_session()
    try:
        question = db.query(Question).filter(Question.question_id == question_id).first()
        if question:
            return question.to_dict()
        return None
    finally:
        db.close()


def update_question(question_id, grade=None, feedback=None, 
                   solo_taxonomy_label=None, duration=None):
    """Update question fields"""
    db = get_db_session()
    try:
        question = db.query(Question).filter(Question.question_id == question_id).first()
        if question:
            if grade is not None:
                question.grade = grade
            if feedback is not None:
                question.feedback = feedback
            if solo_taxonomy_label is not None:
                question.solo_taxonomy_label = solo_taxonomy_label
            if duration is not None:
                question.duration = duration
            db.commit()
            print(f"✅ Updated question ID: {question_id}")
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating question: {e}")
        return False
    finally:
        db.close()


# ========== ANSWER OPERATIONS ==========

def create_answer(question_id, message_id, topic_id=None, accuracy=None, feedback=None):
    """
    Create a new answer linked to a question (one-to-one relationship)
    Each question can have zero or one answer
    """
    db = get_db_session()
    try:
        # Check if answer already exists for this question
        existing = db.query(Answer).filter(Answer.question_id == question_id).first()
        if existing:
            print(f"⚠️  Answer already exists for question ID: {question_id}")
            return existing.answer_id
        
        answer = Answer(
            question_id=question_id,
            message_id=message_id,
            topic_id=topic_id,
            accuracy=accuracy,
            feedback=feedback
        )
        db.add(answer)
        db.commit()
        db.refresh(answer)
        print(f"✅ Created answer with ID: {answer.answer_id}")
        return answer.answer_id
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating answer: {e}")
        return None
    finally:
        db.close()


def get_answer(answer_id):
    """Get answer by ID"""
    db = get_db_session()
    try:
        answer = db.query(Answer).filter(Answer.answer_id == answer_id).first()
        if answer:
            return answer.to_dict()
        return None
    finally:
        db.close()


def get_answer_by_question(question_id):
    """Get answer for a specific question"""
    db = get_db_session()
    try:
        answer = db.query(Answer).filter(Answer.question_id == question_id).first()
        if answer:
            return answer.to_dict()
        return None
    finally:
        db.close()


def update_answer(answer_id, accuracy=None, feedback=None):
    """Update answer fields"""
    db = get_db_session()
    try:
        answer = db.query(Answer).filter(Answer.answer_id == answer_id).first()
        if answer:
            if accuracy is not None:
                answer.accuracy = accuracy
            if feedback is not None:
                answer.feedback = feedback
            db.commit()
            print(f"✅ Updated answer ID: {answer_id}")
            return True
        return False
    except Exception as e:
        db.rollback()
        print(f"❌ Error updating answer: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    load_dotenv()
    data = json.loads(os.environ['MOCK_CHATBOT_DATA'])
    print(data['chatbot_id'])  # Will print: 1
    data = pd.DataFrame(data)
    
    # # Test database connection
    # print("Testing database connection...")
    # try:
    #     with engine.connect() as conn:
    #         result = conn.execute("SELECT 1")
    #         print("✅ Database connection successful!")
            
    #     # Create tables
    #     create_tables = input("\nCreate simplified database tables? (y/n): ")
    #     if create_tables.lower() == 'y':
    #         init_db()
            
    #         # Sample data
    #         create_sample = input("\nCreate sample data? (y/n): ")
    #         if create_sample.lower() == 'y':
    #             print("\n" + "=" * 60)
    #             print("Creating sample data...")
    #             print("=" * 60)
                
    #             # Create chatbot
    #             chatbot_id = create_chatbot()
                
    #             # Create users
    #             user1_id = create_user(chatbot_id)
    #             user2_id = create_user(chatbot_id)
                
    #             # Create conversations
    #             conv1_id = create_conversation(user1_id, "Introduction to Python")
    #             conv2_id = create_conversation(user1_id, "Data Structures Discussion")
    #             conv3_id = create_conversation(user2_id, "Machine Learning Basics")
                
    #             # Create messages with questions and answers
    #             msg1_id = create_message(conv1_id, "user", "What is Python?")
    #             msg2_id = create_message(conv1_id, "bot", "Python is a high-level programming language...")
    #             msg3_id = create_message(conv2_id, "user", "Explain arrays vs lists")
                
    #             # Create questions and answers
    #             q1_id = create_question(msg1_id, grade="A", 
    #                                    solo_taxonomy_label="Relational", 
    #                                    duration=45)
    #             create_answer(q1_id, msg2_id, accuracy=95, 
    #                         feedback="Great explanation!")
                
    #             q2_id = create_question(msg3_id, grade="B+", 
    #                                    solo_taxonomy_label="Multistructural", 
    #                                    duration=30)
                
    #             print("\n" + "=" * 60)
    #             print("Sample data created successfully!")
    #             print("=" * 60)
                
    #             # Display structure
    #             print("\nChatbot data structure:")
    #             chatbot_data = get_chatbot(chatbot_id)
    #             import json
    #             print(json.dumps(chatbot_data, indent=2))
                
    # except Exception as e:
    #     print(f"❌ Database connection failed: {e}")
