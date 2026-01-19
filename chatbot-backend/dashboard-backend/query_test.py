from sqlalchemy import text
from .initialize_database import get_engine

engine = get_engine()

# Check User 101
user_id = 101

with engine.connect() as conn:
    # 1. Count Total Questions for User
    q_count = conn.execute(text("""
        SELECT COUNT(q.id) 
        FROM questions q
        JOIN messages m ON q.message_id = m.id
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.user_id = :uid
    """), {"uid": user_id}).scalar()

    # 2. Count Questions WITH Topics
    topic_link_count = conn.execute(text("""
        SELECT COUNT(qt.question_id)
        FROM questions q
        JOIN messages m ON q.message_id = m.id
        JOIN conversations c ON m.conversation_id = c.id
        JOIN question_topics qt ON q.id = qt.question_id
        WHERE c.user_id = :uid
    """), {"uid": user_id}).scalar()

    print(f"User {user_id} Total Questions: {q_count}")
    print(f"User {user_id} Questions Linked to Topics: {topic_link_count}")

    if q_count > 0 and topic_link_count == 0:
        print("🚨 PROBLEM FOUND: User has data, but NONE of it is linked to a topic.")
        print("   The Inner Joins in your stats queries are filtering everything out.")