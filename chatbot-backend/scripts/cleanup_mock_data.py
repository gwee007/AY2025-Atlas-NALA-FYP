"""
Script to clean up and delete all mock test data from the database.
Removes all test users (test_user_1, test_user_2, etc.) and their associated data.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.session import get_db_session
from app.database.models import (
    User, Conversation, Message, Question, Answer, 
    question_topics, question_subtopics
)


def cleanup_mock_data():
    """Delete all mock test data from database."""
    session = get_db_session()
    
    try:
        print("🗑️  Starting cleanup of mock data...")
        
        # Find all test users
        test_users = session.query(User).filter(
            User.id.like('test_user_%')
        ).all()
        
        if not test_users:
            print("✅ No mock data found. Database is clean.")
            session.close()
            return
        
        print(f"Found {len(test_users)} test users to delete:")
        for user in test_users:
            print(f"  - {user.id}")
        
        deleted_counts = {
            'users': 0,
            'conversations': 0,
            'messages': 0,
            'questions': 0,
            'answers': 0,
            'question_topics': 0,
            'question_subtopics': 0
        }
        
        # Delete in order: answers, questions (and their mappings), messages, conversations, users
        # (respecting foreign key constraints)
        
        for user in test_users:
            # Get all conversations for this user
            conversations = session.query(Conversation).filter(
                Conversation.user_id == user.id
            ).all()
            
            for conv in conversations:
                # Get all messages for this conversation
                messages = session.query(Message).filter(
                    Message.conversation_id == conv.id
                ).all()
                
                for msg in messages:
                    # Delete answers
                    answers = session.query(Answer).filter(
                        Answer.message_id == msg.id
                    ).all()
                    for answer in answers:
                        session.delete(answer)
                        deleted_counts['answers'] += 1
                    
                    # Delete questions and their topic/subtopic mappings
                    questions = session.query(Question).filter(
                        Question.message_id == msg.id
                    ).all()
                    for question in questions:
                        # Delete question_topics mappings
                        result = session.execute(
                            question_topics.delete().where(
                                question_topics.c.question_id == question.id
                            )
                        )
                        deleted_counts['question_topics'] += result.rowcount
                        
                        # Delete question_subtopics mappings
                        result = session.execute(
                            question_subtopics.delete().where(
                                question_subtopics.c.question_id == question.id
                            )
                        )
                        deleted_counts['question_subtopics'] += result.rowcount
                        
                        session.delete(question)
                        deleted_counts['questions'] += 1
                    
                    # Delete message
                    session.delete(msg)
                    deleted_counts['messages'] += 1
                
                # Delete conversation
                session.delete(conv)
                deleted_counts['conversations'] += 1
            
            # Delete user
            session.delete(user)
            deleted_counts['users'] += 1
        
        session.commit()
        
        print("\n✅ Cleanup complete!")
        print(f"📊 Deleted records:")
        print(f"   - Users: {deleted_counts['users']}")
        print(f"   - Conversations: {deleted_counts['conversations']}")
        print(f"   - Messages: {deleted_counts['messages']}")
        print(f"   - Questions: {deleted_counts['questions']}")
        print(f"   - Answers: {deleted_counts['answers']}")
        print(f"   - Question-Topic mappings: {deleted_counts['question_topics']}")
        print(f"   - Question-Subtopic mappings: {deleted_counts['question_subtopics']}")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == '__main__':
    # Safety check
    response = input("⚠️  This will delete all mock test data. Continue? (yes/no): ").strip().lower()
    if response == 'yes':
        cleanup_mock_data()
    else:
        print("Cleanup cancelled.")
