import requests
import os
import pandas as pd
import psycopg2
from psycopg2 import sql
import datetime
import time
# Importing the modules from another file.
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer 
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from grading_calculation import grade_to_point, point_to_grade
from initialize_database import get_engine
# querying the database
from dotenv import load_dotenv
load_dotenv()

# Postgres temporary details 
engine = get_engine()
SessionLocal = sessionmaker(bind=engine)
# conversation_duration= session.execute(text("SELECT AVG(created_at-updated_at) FROM \"conversation\" LIMIT 5")).fetchall()

# Returning json of basic calculations

def individual_statistics(user_id):
    """
    OPTIMIZED VERSION with parameterized queries and combined data fetching.
    Time Complexity with indexes: O(k log N) where k = user's questions
    Prevents SQL injection and allows query plan caching.
    """
    session = SessionLocal()
    try:
        # Single optimized query combining all user statistics with CTE
        result = session.execute(text("""
        WITH user_questions AS(
            -- Pre-join once to avoid repetition
            SELECT 
                q.question_id,
                q.grade,
                q.solo_taxonomy_label,
                a.accuracy,
                a.answer_id
            FROM "question" q
            JOIN "message" m ON q.message_id = m.message_id
            JOIN "conversation" c ON m.conversation_id = c.id
            LEFT JOIN "answer" a ON q.question_id = a.question_id
            WHERE c.user_id = :user_id
        ),
        grade_points AS (
            SELECT 
                CASE grade
                    WHEN 'A+' THEN 4.0
                    WHEN 'A' THEN 4.0
                    WHEN 'A-' THEN 3.7
                    WHEN 'B+' THEN 3.3
                    WHEN 'B' THEN 3.0
                    WHEN 'B-' THEN 2.7
                    WHEN 'C+' THEN 2.3
                    WHEN 'C' THEN 2.0
                    WHEN 'C-' THEN 1.7
                    WHEN 'D+' THEN 1.3
                    WHEN 'D' THEN 1.0
                    WHEN 'F' THEN 0.0
                    ELSE 0.0
                END as points,
                solo_taxonomy_label,
                accuracy
            FROM user_questions
        )
        SELECT 
            -- Conversation stats
            (SELECT AVG(updated_at - created_at) FROM "conversation" WHERE user_id = :user_id) as avg_duration,
            (SELECT COUNT(*) FROM "conversation" WHERE user_id = :user_id) as conv_count,
            -- Overall stats
            (SELECT AVG(points) FROM grade_points WHERE points IS NOT NULL) as avg_grade,
            (SELECT AVG(accuracy) FROM grade_points WHERE accuracy IS NOT NULL) as avg_accuracy
        """), {"user_id": user_id}).fetchone()
        
        # Separate queries for grouped data (still need these for detailed breakdown)
        accuracy_by_category = session.execute(text("""
        SELECT 
            q.solo_taxonomy_label,
            COUNT(a.answer_id) as answer_count,
            AVG(a.accuracy) as avg_accuracy
        FROM "question" q
        JOIN "message" m ON q.message_id = m.message_id
        JOIN "conversation" c ON m.conversation_id = c.id
        JOIN "answer" a ON q.question_id = a.question_id
        WHERE c.user_id = :user_id 
            AND q.solo_taxonomy_label IS NOT NULL 
            AND a.accuracy IS NOT NULL
        GROUP BY q.solo_taxonomy_label
        ORDER BY avg_accuracy DESC
        """), {"user_id": user_id}).fetchall()

        questions_by_category = session.execute(text("""
        SELECT 
            q.solo_taxonomy_label,
            COUNT(q.question_id) as question_count,
            AVG(
                CASE q.grade
                    WHEN 'A+' THEN 4.0
                    WHEN 'A' THEN 4.0
                    WHEN 'A-' THEN 3.7
                    WHEN 'B+' THEN 3.3
                    WHEN 'B' THEN 3.0
                    WHEN 'B-' THEN 2.7
                    WHEN 'C+' THEN 2.3
                    WHEN 'C' THEN 2.0
                    WHEN 'C-' THEN 1.7
                    WHEN 'D+' THEN 1.3
                    WHEN 'D' THEN 1.0
                    WHEN 'F' THEN 0.0
                    ELSE 0.0
                END
            ) as avg_grade_points
        FROM "question" q
        JOIN "message" m ON q.message_id = m.message_id
        JOIN "conversation" c ON m.conversation_id = c.id
        WHERE c.user_id = :user_id AND q.solo_taxonomy_label IS NOT NULL
        GROUP BY q.solo_taxonomy_label
        ORDER BY avg_grade_points DESC
        """), {"user_id": user_id}).fetchall()
        
        # GROUP BY TOPIC - for efficient dashboard filtering
        grades_by_topic = session.execute(text("""
            SELECT 
                t.id as topic_id,
                t.topic_name,
                COUNT(q.question_id) as question_count,
                AVG(
                    CASE q.grade
                        WHEN 'A+' THEN 4.0
                        WHEN 'A' THEN 4.0
                        WHEN 'A-' THEN 3.7
                        WHEN 'B+' THEN 3.3
                        WHEN 'B' THEN 3.0
                        WHEN 'B-' THEN 2.7
                        WHEN 'C+' THEN 2.3
                        WHEN 'C' THEN 2.0
                        WHEN 'C-' THEN 1.7
                        WHEN 'D+' THEN 1.3
                        WHEN 'D' THEN 1.0
                        WHEN 'F' THEN 0.0
                        ELSE 0.0
                    END
                ) as avg_grade_points
            FROM "topics" t
            LEFT JOIN "question" q ON t.id = q.topic_id
            JOIN "message" m ON q.message_id = m.message_id
            JOIN "conversation" c ON m.conversation_id = c.id
            WHERE c.user_id = :user_id AND q.grade IS NOT NULL
            GROUP BY t.id, t.topic_name
            ORDER BY avg_grade_points DESC
        """), {"user_id": user_id}).fetchall()
        
        accuracy_by_topic = session.execute(text("""
            SELECT 
                t.id as topic_id,
                t.topic_name,
                COUNT(a.answer_id) as answer_count,
                AVG(a.accuracy) as avg_accuracy
            FROM "topics" t
            LEFT JOIN "answer" a ON t.id = a.topic_id
            JOIN "question" q ON a.question_id = q.question_id
            JOIN "message" m ON q.message_id = m.message_id
            JOIN "conversation" c ON m.conversation_id = c.id
            WHERE c.user_id = :user_id AND a.accuracy IS NOT NULL
            GROUP BY t.id, t.topic_name
            ORDER BY avg_accuracy DESC
        """), {"user_id": user_id}).fetchall()
        
        # TIME SERIES DATA - Interactions over time by topic
        interactions_over_time_by_topic = session.execute(text("""
            SELECT 
                DATE(c.created_at) as date,
                t.id as topic_id,
                t.topic_name,
                COUNT(DISTINCT m.message_id) as interaction_count
            FROM "conversation" c
            JOIN "message" m ON c.id = m.conversation_id
            JOIN "question" q ON m.message_id = q.message_id
            JOIN "topics" t ON q.topic_id = t.id
            WHERE c.user_id = :user_id
            GROUP BY DATE(c.created_at), t.id, t.topic_name
            ORDER BY date, t.topic_name
        """), {"user_id": user_id}).fetchall()
        
        # TIME SERIES DATA - Conversation duration over time by topic
        duration_over_time_by_topic = session.execute(text("""
            SELECT 
                DATE(c.created_at) as date,
                t.id as topic_id,
                t.topic_name,
                AVG(c.updated_at - c.created_at) as avg_duration
            FROM "conversation" c
            JOIN "message" m ON c.id = m.conversation_id
            JOIN "question" q ON m.message_id = q.message_id
            JOIN "topics" t ON q.topic_id = t.id
            WHERE c.user_id = :user_id
            GROUP BY DATE(c.created_at), t.id, t.topic_name
            ORDER BY date, t.topic_name
        """), {"user_id": user_id}).fetchall()
        
        # DOUBLE-GROUPED DATA - Accuracy by SOLO category AND topic
        accuracy_by_solo_and_topic = session.execute(text("""
            SELECT 
                q.solo_taxonomy_label,
                t.id as topic_id,
                t.topic_name,
                COUNT(a.answer_id) as answer_count,
                AVG(a.accuracy) as avg_accuracy
            FROM "question" q
            JOIN "message" m ON q.message_id = m.message_id
            JOIN "conversation" c ON m.conversation_id = c.id
            JOIN "answer" a ON q.question_id = a.question_id
            JOIN "topics" t ON q.topic_id = t.id
            WHERE c.user_id = :user_id 
                AND q.solo_taxonomy_label IS NOT NULL 
                AND a.accuracy IS NOT NULL
            GROUP BY q.solo_taxonomy_label, t.id, t.topic_name
            ORDER BY t.topic_name, q.solo_taxonomy_label
        """), {"user_id": user_id}).fetchall()
        
        # DOUBLE-GROUPED DATA - Question count by SOLO category AND topic
        questions_by_solo_and_topic = session.execute(text("""
            SELECT 
                q.solo_taxonomy_label,
                t.id as topic_id,
                t.topic_name,
                COUNT(q.question_id) as question_count,
                AVG(
                    CASE q.grade
                        WHEN 'A+' THEN 4.0
                        WHEN 'A' THEN 4.0
                        WHEN 'A-' THEN 3.7
                        WHEN 'B+' THEN 3.3
                        WHEN 'B' THEN 3.0
                        WHEN 'B-' THEN 2.7
                        WHEN 'C+' THEN 2.3
                        WHEN 'C' THEN 2.0
                        WHEN 'C-' THEN 1.7
                        WHEN 'D+' THEN 1.3
                        WHEN 'D' THEN 1.0
                        WHEN 'F' THEN 0.0
                        ELSE 0.0
                    END
                ) as avg_grade_points
            FROM "question" q
            JOIN "message" m ON q.message_id = m.message_id
            JOIN "conversation" c ON m.conversation_id = c.id
            JOIN "topics" t ON q.topic_id = t.id
            WHERE c.user_id = :user_id 
                AND q.solo_taxonomy_label IS NOT NULL
            GROUP BY q.solo_taxonomy_label, t.id, t.topic_name
            ORDER BY t.topic_name, q.solo_taxonomy_label
        """), {"user_id": user_id}).fetchall()
        
        # Extract values from the combined result
        conversation_duration = result[0] if result else None
        conversation_number = result[1] if result else 0
        question_grade = result[2] if result else None
        answer_accuracy = result[3] if result else None
        
        # Return structured data
        return {
            'user_id': user_id,
            'conversation_duration': str(conversation_duration) if conversation_duration else None,
            'conversation_count': conversation_number,
            'average_question_grade': float(question_grade) if question_grade else None,
            'average_answer_accuracy': float(answer_accuracy) if answer_accuracy else None,
            'accuracy_by_solo_category': [
                {
                    'category': row[0],
                    'answer_count': row[1],
                    'avg_accuracy': float(row[2]) if row[2] else None
                } for row in accuracy_by_category
            ],
            'questions_by_solo_category': [
                {
                    'category': row[0],
                    'question_count': row[1],
                    'avg_grade_points': float(row[2]) if row[2] else None,
                    'avg_grade_letter': point_to_grade(row[2]) if row[2] else 'N/A'
                } for row in questions_by_category
            ],
            # Topic-based grouping for dashboard filtering
            'grades_by_topic': [
                {
                    'topic_id': row[0],
                    'topic_name': row[1],
                    'question_count': row[2],
                    'avg_grade_points': float(row[3]) if row[3] else None,
                    'avg_grade_letter': point_to_grade(row[3]) if row[3] else 'N/A'
                } for row in grades_by_topic
            ],
            'accuracy_by_topic': [
                {
                    'topic_id': row[0],
                    'topic_name': row[1],
                    'answer_count': row[2],
                    'avg_accuracy': float(row[3]) if row[3] else None
                } for row in accuracy_by_topic
            ],
            # Time series data for charts
            'interactions_over_time_by_topic': [
                {
                    'date': row[0].isoformat() if row[0] else None,
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'interaction_count': row[3]
                } for row in interactions_over_time_by_topic
            ],
            'duration_over_time_by_topic': [
                {
                    'date': row[0].isoformat() if row[0] else None,
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'avg_duration': str(row[3]) if row[3] else None
                } for row in duration_over_time_by_topic
            ],
            # Double-grouped data for filtered SOLO taxonomy charts
            'accuracy_by_solo_and_topic': [
                {
                    'solo_category': row[0],
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'answer_count': row[3],
                    'avg_accuracy': float(row[4]) if row[4] else None
                } for row in accuracy_by_solo_and_topic
            ],
            'questions_by_solo_and_topic': [
                {
                    'solo_category': row[0],
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'question_count': row[3],
                    'avg_grade_points': float(row[4]) if row[4] else None,
                    'avg_grade_letter': point_to_grade(row[4]) if row[4] else 'N/A'
                } for row in questions_by_solo_and_topic
            ]
        }
    finally:
        session.close()

# Create performance indexes for optimized queries (run once on startup)
def create_indexes_if_needed():
    """Creates database indexes. IF NOT EXISTS prevents duplicates automatically."""
    print("\n--- Ensuring Database Indexes Exist ---")
    session = SessionLocal()
    try:
        # IF NOT EXISTS handles duplicates - safe to run multiple times
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_conversation_user_id ON conversation(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_message_conversation_id ON message(conversation_id)",
            "CREATE INDEX IF NOT EXISTS idx_question_message_id ON question(message_id)",
            "CREATE INDEX IF NOT EXISTS idx_answer_question_id ON answer(question_id)",
            "CREATE INDEX IF NOT EXISTS idx_question_solo_taxonomy ON question(solo_taxonomy_label)",
            "CREATE INDEX IF NOT EXISTS idx_question_topic_id ON question(topic_id)",
            "CREATE INDEX IF NOT EXISTS idx_answer_topic_id ON answer(topic_id)",
            # New indexes for time-series queries
            "CREATE INDEX IF NOT EXISTS idx_conversation_created_at ON conversation(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_conversation_user_created ON conversation(user_id, created_at)"
        ]
        
        for idx_sql in indexes:
            session.execute(text(idx_sql))
        
        session.commit()
        print("Database indexes verified/created successfully")
    except Exception as e:
        print(f"Index creation note: {e}")
        session.rollback()
    finally:
        session.close()

def group_statistics():
    """
    Calculate statistics across ALL users and topics.
    Call this function explicitly when you need overall statistics.
    Returns a dictionary with all group-level metrics.
    """
    print("\n=== Calculating Group Statistics ===")
    session = SessionLocal()
    try:
        # Average conversation duration across all users
        avg_conversation_duration = session.execute(text("""
        SELECT AVG(updated_at - created_at) 
        FROM "conversation"
        """)).scalar()
        
        # Conversation count per user
        conversation_counts = session.execute(text("""
            SELECT user_id, COUNT(*) as count
            FROM "conversation" 
            GROUP BY user_id
        """)).fetchall()
        
        # Average conversations per user
        avg_conversations_per_user = session.execute(text("""
            SELECT AVG(conversation_count) 
            FROM (
                SELECT COUNT(*) AS conversation_count 
                FROM "conversation" 
                GROUP BY user_id
            ) AS subquery
        """)).scalar()
        
        # Average grade of questions answered
        average_grade = session.execute(text("""
            SELECT AVG(
                CASE grade
                    WHEN 'A+' THEN 4.0
                    WHEN 'A' THEN 4.0
                    WHEN 'A-' THEN 3.7
                    WHEN 'B+' THEN 3.3
                    WHEN 'B' THEN 3.0
                    WHEN 'B-' THEN 2.7
                    WHEN 'C+' THEN 2.3
                    WHEN 'C' THEN 2.0
                    WHEN 'C-' THEN 1.7
                    WHEN 'D+' THEN 1.3
                    WHEN 'D' THEN 1.0
                    WHEN 'F' THEN 0.0
                    ELSE 0.0
                END
            ) as average_grade
            FROM "question"
        """)).scalar()

        # Average accuracy of answers
        average_accuracy = session.execute(text("""
            SELECT AVG(accuracy) as average_accuracy
            FROM "answer"
            WHERE accuracy IS NOT NULL
        """)).scalar()

        # Average grade grouped by topic
        grades_by_topic = session.execute(text("""
            SELECT 
                t.topic_name,
                COUNT(q.question_id) as question_count,
                AVG(
                    CASE q.grade
                        WHEN 'A+' THEN 4.0
                        WHEN 'A' THEN 4.0
                        WHEN 'A-' THEN 3.7
                        WHEN 'B+' THEN 3.3
                        WHEN 'B' THEN 3.0
                        WHEN 'B-' THEN 2.7
                        WHEN 'C+' THEN 2.3
                        WHEN 'C' THEN 2.0
                        WHEN 'C-' THEN 1.7
                        WHEN 'D+' THEN 1.3
                        WHEN 'D' THEN 1.0
                        WHEN 'F' THEN 0.0
                        ELSE 0.0
                    END
                ) as avg_grade_points
            FROM "topics" t
            LEFT JOIN "question" q ON t.id = q.topic_id
            WHERE q.grade IS NOT NULL
            GROUP BY t.id, t.topic_name
            ORDER BY avg_grade_points DESC
        """)).fetchall()

        # Average accuracy grouped by topic
        accuracy_by_topic = session.execute(text("""
            SELECT 
                t.topic_name,
                COUNT(a.answer_id) as answer_count,
                AVG(a.accuracy) as avg_accuracy
            FROM "topics" t
            LEFT JOIN "answer" a ON t.id = a.topic_id
            WHERE a.accuracy IS NOT NULL
            GROUP BY t.id, t.topic_name
            ORDER BY avg_accuracy DESC
        """)).fetchall()

        # Count conversations per topic
        conversations_by_topic = session.execute(text("""
            SELECT 
                t.topic_name,
                COUNT(DISTINCT c.id) as conversation_count
            FROM "topics" t
            LEFT JOIN "question" q ON t.id = q.topic_id
            LEFT JOIN "message" m ON q.message_id = m.message_id
            LEFT JOIN "conversation" c ON m.conversation_id = c.id
            GROUP BY t.id, t.topic_name
            ORDER BY conversation_count DESC
        """)).fetchall()
        
        # TIME SERIES DATA - Average interactions over time by topic (for all users)
        avg_interactions_over_time_by_topic = session.execute(text("""
            SELECT 
                user_daily_interactions.date,
                user_daily_interactions.topic_id,
                t.topic_name,
                AVG(user_daily_interactions.interaction_count) as avg_interaction_count
            FROM (
                SELECT 
                    c.user_id,
                    DATE(c.created_at) as date,
                    t.id as topic_id,
                    COUNT(DISTINCT m.message_id) as interaction_count
                FROM "conversation" c
                JOIN "message" m ON c.id = m.conversation_id
                JOIN "question" q ON m.message_id = q.message_id
                JOIN "topics" t ON q.topic_id = t.id
                GROUP BY c.user_id, DATE(c.created_at), t.id
            ) user_daily_interactions
            JOIN "topics" t ON user_daily_interactions.topic_id = t.id
            GROUP BY user_daily_interactions.date, user_daily_interactions.topic_id, t.topic_name
            ORDER BY user_daily_interactions.date, t.topic_name
        """)).fetchall()
        
        # TIME SERIES DATA - Average duration over time by topic (for all users)
        avg_duration_over_time_by_topic = session.execute(text("""
            SELECT 
                DATE(c.created_at) as date,
                t.id as topic_id,
                t.topic_name,
                AVG(c.updated_at - c.created_at) as avg_duration
            FROM "conversation" c
            JOIN "message" m ON c.id = m.conversation_id
            JOIN "question" q ON m.message_id = q.message_id
            JOIN "topics" t ON q.topic_id = t.id
            GROUP BY DATE(c.created_at), t.id, t.topic_name
            ORDER BY date, t.topic_name
        """)).fetchall()
        
        # DOUBLE-GROUPED DATA - Average accuracy by SOLO category AND topic (all users)
        avg_accuracy_by_solo_and_topic = session.execute(text("""
            SELECT 
                q.solo_taxonomy_label,
                t.id as topic_id,
                t.topic_name,
                COUNT(a.answer_id) as answer_count,
                AVG(a.accuracy) as avg_accuracy
            FROM "question" q
            JOIN "answer" a ON q.question_id = a.question_id
            JOIN "topics" t ON q.topic_id = t.id
            WHERE q.solo_taxonomy_label IS NOT NULL 
                AND a.accuracy IS NOT NULL
            GROUP BY q.solo_taxonomy_label, t.id, t.topic_name
            ORDER BY t.topic_name, q.solo_taxonomy_label
        """)).fetchall()
        
        # DOUBLE-GROUPED DATA - Average question count by SOLO category AND topic (all users)
        avg_questions_by_solo_and_topic = session.execute(text("""
            SELECT 
                q.solo_taxonomy_label,
                t.id as topic_id,
                t.topic_name,
                COUNT(q.question_id) as question_count,
                AVG(
                    CASE q.grade
                        WHEN 'A+' THEN 4.0
                        WHEN 'A' THEN 4.0
                        WHEN 'A-' THEN 3.7
                        WHEN 'B+' THEN 3.3
                        WHEN 'B' THEN 3.0
                        WHEN 'B-' THEN 2.7
                        WHEN 'C+' THEN 2.3
                        WHEN 'C' THEN 2.0
                        WHEN 'C-' THEN 1.7
                        WHEN 'D+' THEN 1.3
                        WHEN 'D' THEN 1.0
                        WHEN 'F' THEN 0.0
                        ELSE 0.0
                    END
                ) as avg_grade_points
            FROM "question" q
            JOIN "topics" t ON q.topic_id = t.id
            WHERE q.solo_taxonomy_label IS NOT NULL
            GROUP BY q.solo_taxonomy_label, t.id, t.topic_name
            ORDER BY t.topic_name, q.solo_taxonomy_label
        """)).fetchall()
        
        # Return structured data
        return {
            'average_conversation_duration': str(avg_conversation_duration) if avg_conversation_duration else None,
            'conversations_per_user': [{'user_id': row[0], 'count': row[1]} for row in conversation_counts],
            'average_conversations_per_user': float(avg_conversations_per_user) if avg_conversations_per_user else None,
            'overall_average_grade': float(average_grade) if average_grade else None,
            'overall_average_grade_letter': point_to_grade(average_grade) if average_grade else 'N/A',
            'overall_average_accuracy': float(average_accuracy) if average_accuracy else None,
            'grades_by_topic': [
                {
                    'topic_name': row[0],
                    'question_count': row[1],
                    'avg_grade_points': float(row[2]) if row[2] else None,
                    'avg_grade_letter': point_to_grade(row[2]) if row[2] else 'N/A'
                } for row in grades_by_topic
            ],
            'accuracy_by_topic': [
                {
                    'topic_name': row[0],
                    'answer_count': row[1],
                    'avg_accuracy': float(row[2]) if row[2] else None
                } for row in accuracy_by_topic
            ],
            'conversations_by_topic': [
                {
                    'topic_name': row[0],
                    'conversation_count': row[1]
                } for row in conversations_by_topic
            ],
            # Time series data for charts (class averages)
            'avg_interactions_over_time_by_topic': [
                {
                    'date': row[0].isoformat() if row[0] else None,
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'avg_interaction_count': float(row[3]) if row[3] else None
                } for row in avg_interactions_over_time_by_topic
            ],
            'avg_duration_over_time_by_topic': [
                {
                    'date': row[0].isoformat() if row[0] else None,
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'avg_duration': str(row[3]) if row[3] else None
                } for row in avg_duration_over_time_by_topic
            ],
            # Double-grouped data for filtered SOLO taxonomy charts (class averages)
            'avg_accuracy_by_solo_and_topic': [
                {
                    'solo_category': row[0],
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'answer_count': row[3],
                    'avg_accuracy': float(row[4]) if row[4] else None
                } for row in avg_accuracy_by_solo_and_topic
            ],
            'avg_questions_by_solo_and_topic': [
                {
                    'solo_category': row[0],
                    'topic_id': row[1],
                    'topic_name': row[2],
                    'question_count': row[3],
                    'avg_grade_points': float(row[4]) if row[4] else None,
                    'avg_grade_letter': point_to_grade(row[4]) if row[4] else 'N/A'
                } for row in avg_questions_by_solo_and_topic
            ]}
    finally:
            session.close()

# Only run when script is executed directly (not when imported)
if __name__ == "__main__":
    # Start timing
    start_time = time.perf_counter()
    
    create_indexes_if_needed()
    
    index_time = time.perf_counter()
    print(f"\nIndex creation: {(index_time - start_time)*1000:.2f}ms")

    # Initialization: find a list of users from the absolute mess that is the mock data
    users = session.execute(text("SELECT DISTINCT user_id FROM \"conversation\"")).fetchall()
    print(f"\All user ids: {[row[0] for row in users]}")
    # ... oh it's just 3 lol 
    
    # Test group statistics
    print("\n=== Testing Group Statistics ===")
    group_start = time.perf_counter()
    group_stats = group_statistics()
    group_end = time.perf_counter()
    print(f"Group statistics: {(group_end - group_start)*1000:.2f}ms")
    print(f"\nOverall Average Question Grade: {group_stats['overall_average_grade_letter']}")
    print(f"Overall Average Accuracy: {group_stats['overall_average_accuracy']:.2f}%" if group_stats['overall_average_accuracy'] else "No data")
    
    # Test individual statistics
    print("\n=== Testing Individual Statistics (User 103) ===")
    individual_start = time.perf_counter()
    individual_stats = individual_statistics(103)
    individual_end = time.perf_counter()
    print(f"⏱️  Individual statistics: {(individual_end - individual_start)*1000:.2f}ms")
    print(f"User 103 Average Question Grade: {individual_stats['average_question_grade']:.2f}" if individual_stats['average_question_grade'] else "No data")
    print(f"User 103 Average Answer Accuracy: {individual_stats['average_answer_accuracy']:.2f}%" if individual_stats['average_answer_accuracy'] else "No data")
    print(f"User 103 Conversation Count: {individual_stats['conversation_count']}")
    
    # Look at user 1's list of questions and their grades for verification
    print("\nUser 103 Questions by Solo Category:")
    question_query =  session.execute(text("""
        SELECT 
            q.question_id,
            q.solo_taxonomy_label,
            q.grade
        FROM "question" q
        JOIN "message" m ON q.message_id = m.message_id
        JOIN "conversation" c ON m.conversation_id = c.id
        WHERE c.user_id = :user_id
        ORDER BY q.solo_taxonomy_label
    """), {"user_id": 103}).fetchall()
    for row in question_query:
        print(f"  Question ID: {row[0]}, Category: {row[1]}, Grade: {row[2]}")
    
    # Total execution time
    total_time = time.perf_counter() - start_time
    print(f"\n{'='*50}")
    print(f"⏱️  TOTAL EXECUTION TIME: {total_time*1000:.2f}ms")
    print(f"{'='*50}")
    