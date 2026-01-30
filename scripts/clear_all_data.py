"""
Script to clear all data from specified tables.
Tables cleared: question_subtopics, question_topics, questions, answers, conversations, users, messages
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import get_db
from app.database.models import (
    question_subtopics,
    question_topics,
    Question,
    Answer,
    Message,
    Conversation,
    User
)

def clear_all_data():
    """Clear all data from specified tables in the correct order to respect foreign key constraints."""
    db = next(get_db())
    
    try:
        print("Starting data cleanup...")
        
        # Delete in reverse order of dependencies
        print("Deleting question_subtopics...")
        db.execute(question_subtopics.delete())
        
        print("Deleting question_topics...")
        db.execute(question_topics.delete())
        
        print("Deleting answers...")
        deleted_answers = db.query(Answer).delete()
        print(f"  - Deleted {deleted_answers} answers")
        
        print("Deleting questions...")
        deleted_questions = db.query(Question).delete()
        print(f"  - Deleted {deleted_questions} questions")
        
        print("Deleting messages...")
        deleted_messages = db.query(Message).delete()
        print(f"  - Deleted {deleted_messages} messages")
        
        print("Deleting conversations...")
        deleted_conversations = db.query(Conversation).delete()
        print(f"  - Deleted {deleted_conversations} conversations")
        
        print("Deleting users...")
        deleted_users = db.query(User).delete()
        print(f"  - Deleted {deleted_users} users")
        
        db.commit()
        print("\n✓ All data cleared successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"\n✗ Error clearing data: {str(e)}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    confirm = input("This will delete ALL data from the specified tables. Are you sure? (yes/no): ")
    if confirm.lower() == 'yes':
        clear_all_data()
    else:
        print("Operation cancelled.")
