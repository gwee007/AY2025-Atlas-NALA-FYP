import time
import datetime
from sqlalchemy import create_engine, select, func, case, desc, cast, Date, distinct, and_, Index
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Import your models
from models_simple import Base, Chatbot, User, Conversation, Message, Question, Answer, Topic
from grading_calculation import point_to_grade
from initialize_database import get_engine

load_dotenv()

engine = get_engine()
SessionLocal = sessionmaker(bind=engine)

# --- REUSABLE EXPRESSIONS ---

# 1. Reusable Case Expression for converting Grade Letter -> Number
grade_points_expr = case(
    (Question.grade == 'A+', 4.0),
    (Question.grade == 'A', 4.0),
    (Question.grade == 'A-', 3.7),
    (Question.grade == 'B+', 3.3),
    (Question.grade == 'B', 3.0),
    (Question.grade == 'B-', 2.7),
    (Question.grade == 'C+', 2.3),
    (Question.grade == 'C', 2.0),
    (Question.grade == 'C-', 1.7),
    (Question.grade == 'D+', 1.3),
    (Question.grade == 'D', 1.0),
    (Question.grade == 'F', 0.0),
    else_=0.0
).label("grade_points")

def group_statistics():
    """
    Calculates statistics across ALL users using pure SQLAlchemy expressions.
    """
    print("\n=== Calculating Group Statistics (ORM) ===")
    session = SessionLocal()
    try:
        # 1. Average Duration
        avg_duration_stmt = select(func.avg(Conversation.updated_at - Conversation.created_at))
        avg_conversation_duration = session.execute(avg_duration_stmt).scalar()

        # 2. Conversations per User
        conv_counts_stmt = (
            select(Conversation.user_id, func.count(Conversation.id).label('count'))
            .group_by(Conversation.user_id)
        )
        conversation_counts = session.execute(conv_counts_stmt).fetchall()

        # 3. Avg Conversations per User (Using a subquery)
        # SQL equivalent: SELECT AVG(cnt) FROM (SELECT count(*) as cnt ... GROUP BY user)
        subq = (
            select(func.count(Conversation.id).label('cnt'))
            .group_by(Conversation.user_id)
            .subquery()
        )
        avg_conv_per_user_stmt = select(func.avg(subq.c.cnt))
        avg_conversations_per_user = session.execute(avg_conv_per_user_stmt).scalar()

        # 4. Overall Average Grade
        avg_grade_stmt = select(func.avg(grade_points_expr))
        average_grade = session.execute(avg_grade_stmt).scalar()

        # 5. Overall Average Accuracy
        avg_acc_stmt = select(func.avg(Answer.accuracy)).where(Answer.accuracy.is_not(None))
        average_accuracy = session.execute(avg_acc_stmt).scalar()

        # 6. Grades by Topic
        grades_topic_stmt = (
            select(
                Topic.topic_name,
                func.count(Question.question_id).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points")
            )
            .select_from(Topic)
            .outerjoin(Question, Topic.id == Question.topic_id)
            .where(Question.grade.is_not(None))
            .group_by(Topic.id, Topic.topic_name)
            .order_by(desc("avg_grade_points"))
        )
        grades_by_topic = session.execute(grades_topic_stmt).fetchall()

        # 7. Accuracy by Topic
        acc_topic_stmt = (
            select(
                Topic.topic_name,
                func.count(Answer.answer_id).label("answer_count"),
                func.avg(Answer.accuracy).label("avg_accuracy")
            )
            .select_from(Topic)
            .outerjoin(Answer, Topic.id == Answer.topic_id)
            .where(Answer.accuracy.is_not(None))
            .group_by(Topic.id, Topic.topic_name)
            .order_by(desc("avg_accuracy"))
        )
        accuracy_by_topic = session.execute(acc_topic_stmt).fetchall()

        # 8. Conversations by Topic (Complex Join)
        conv_topic_stmt = (
            select(
                Topic.topic_name,
                func.count(distinct(Conversation.id)).label("conversation_count")
            )
            .select_from(Topic)
            .outerjoin(Question, Topic.id == Question.topic_id)
            .outerjoin(Message, Question.message_id == Message.message_id)
            .outerjoin(Conversation, Message.conversation_id == Conversation.id)
            .group_by(Topic.id, Topic.topic_name)
            .order_by(desc("conversation_count"))
        )
        conversations_by_topic = session.execute(conv_topic_stmt).fetchall()

        # 9. Time Series: Interactions (Avg across users)
        # Note: This matches your SQL logic of calculating daily interactions per user first
        daily_interactions_subq = (
            select(
                Conversation.user_id,
                cast(Conversation.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                func.count(distinct(Message.message_id)).label("interaction_count")
            )
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.message_id == Question.message_id)
            .join(Topic, Question.topic_id == Topic.id)
            .group_by(Conversation.user_id, cast(Conversation.created_at, Date), Topic.id)
            .subquery()
        )

        avg_interactions_stmt = (
            select(
                daily_interactions_subq.c.date,
                daily_interactions_subq.c.topic_id,
                Topic.topic_name,
                func.avg(daily_interactions_subq.c.interaction_count).label("avg_interaction_count")
            )
            .join(Topic, daily_interactions_subq.c.topic_id == Topic.id)
            .group_by(daily_interactions_subq.c.date, daily_interactions_subq.c.topic_id, Topic.topic_name)
            .order_by(daily_interactions_subq.c.date, Topic.topic_name)
        )
        avg_interactions_over_time_by_topic = session.execute(avg_interactions_stmt).fetchall()

        # 10. Time Series: Duration
        avg_duration_ts_stmt = (
            select(
                cast(Conversation.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.avg(Conversation.updated_at - Conversation.created_at).label("avg_duration")
            )
            .select_from(Conversation)
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.message_id == Question.message_id)
            .join(Topic, Question.topic_id == Topic.id)
            .group_by(cast(Conversation.created_at, Date), Topic.id, Topic.topic_name)
            .order_by("date", Topic.topic_name)
        )
        avg_duration_over_time_by_topic = session.execute(avg_duration_ts_stmt).fetchall()

        # 11. Double Grouped: Accuracy
        avg_acc_solo_topic_stmt = (
            select(
                Question.solo_taxonomy_label,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.answer_id).label("answer_count"),
                func.avg(Answer.accuracy).label("avg_accuracy")
            )
            .join(Answer, Question.question_id == Answer.question_id)
            .join(Topic, Question.topic_id == Topic.id)
            .where(and_(Question.solo_taxonomy_label.is_not(None), Answer.accuracy.is_not(None)))
            .group_by(Question.solo_taxonomy_label, Topic.id, Topic.topic_name)
            .order_by(Topic.topic_name, Question.solo_taxonomy_label)
        )
        avg_accuracy_by_solo_and_topic = session.execute(avg_acc_solo_topic_stmt).fetchall()

        # 12. Double Grouped: Question Counts/Grades
        avg_q_solo_topic_stmt = (
            select(
                Question.solo_taxonomy_label,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Question.question_id).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points")
            )
            .join(Topic, Question.topic_id == Topic.id)
            .where(Question.solo_taxonomy_label.is_not(None))
            .group_by(Question.solo_taxonomy_label, Topic.id, Topic.topic_name)
            .order_by(Topic.topic_name, Question.solo_taxonomy_label)
        )
        avg_questions_by_solo_and_topic = session.execute(avg_q_solo_topic_stmt).fetchall()

        return {
            'average_conversation_duration': str(avg_conversation_duration) if avg_conversation_duration else None,
            'conversations_per_user': [{'user_id': row[0], 'count': row[1]} for row in conversation_counts],
            'average_conversations_per_user': float(avg_conversations_per_user) if avg_conversations_per_user else None,
            'overall_average_grade': float(average_grade) if average_grade else None,
            'overall_average_grade_letter': point_to_grade(average_grade) if average_grade else 'N/A',
            'overall_average_accuracy': float(average_accuracy) if average_accuracy else None,
            'grades_by_topic': [{
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_grade_points': float(row.avg_grade_points) if row.avg_grade_points else None,
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points else 'N/A'
            } for row in grades_by_topic],
            'accuracy_by_topic': [{
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': float(row.avg_accuracy) if row.avg_accuracy else None
            } for row in accuracy_by_topic],
            'conversations_by_topic': [{
                'topic_name': row.topic_name,
                'conversation_count': row.conversation_count
            } for row in conversations_by_topic],
            'avg_interactions_over_time_by_topic': [{
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_interaction_count': float(row.avg_interaction_count) if row.avg_interaction_count else None
            } for row in avg_interactions_over_time_by_topic],
            'avg_duration_over_time_by_topic': [{
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_duration': str(row.avg_duration) if row.avg_duration else None
            } for row in avg_duration_over_time_by_topic],
            'avg_accuracy_by_solo_and_topic': [{
                'solo_category': row.solo_taxonomy_label,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': float(row.avg_accuracy) if row.avg_accuracy else None
            } for row in avg_accuracy_by_solo_and_topic],
            'avg_questions_by_solo_and_topic': [{
                'solo_category': row.solo_taxonomy_label,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_grade_points': float(row.avg_grade_points) if row.avg_grade_points else None,
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points else 'N/A'
            } for row in avg_questions_by_solo_and_topic]
        }

    finally:
        session.close()

def individual_statistics(user_id):
    try: 
        session = SessionLocal()
        
        # 1. Overall Stats (Using CTEs for reuse)
        user_questions_cte = (
            select(
                Question.question_id.label("question_id"),
                Question.grade,
                Question.solo_taxonomy_label,
                Answer.accuracy,
                Answer.answer_id.label("answer_id")
            )
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .outerjoin(Answer, Question.question_id == Answer.question_id)
            .where(Conversation.user_id == user_id)
        ).cte("user_questions")
        
        # Reuse the grade_points_expr logic but applied to the CTE columns
        grade_points_cte = (
            select(
                case(
                    (user_questions_cte.c.grade == 'A+', 4.0),
                    (user_questions_cte.c.grade == 'A', 4.0),
                    (user_questions_cte.c.grade == 'A-', 3.7),
                    (user_questions_cte.c.grade == 'B+', 3.3),
                    (user_questions_cte.c.grade == 'B', 3.0),
                    (user_questions_cte.c.grade == 'B-', 2.7),
                    (user_questions_cte.c.grade == 'C+', 2.3),
                    (user_questions_cte.c.grade == 'C', 2.0),
                    (user_questions_cte.c.grade == 'C-', 1.7),
                    (user_questions_cte.c.grade == 'D+', 1.3),
                    (user_questions_cte.c.grade == 'D', 1.0),
                    (user_questions_cte.c.grade == 'F', 0.0),
                    else_=0.0
                ).label("points"),
                user_questions_cte.c.accuracy
            )
        ).cte("grade_points")

        avg_duration_subq = (
            select(func.avg(Conversation.updated_at - Conversation.created_at))
            .where(Conversation.user_id == user_id)
            .scalar_subquery()
        )

        conv_count_subq = (
            select(func.count())
            .where(Conversation.user_id == user_id)
            .scalar_subquery()
        )

        overall_stats_stmt = select(
            avg_duration_subq.label("avg_duration"),
            conv_count_subq.label("conv_count"),
            func.avg(grade_points_cte.c.points).label("avg_grade"),
            func.avg(grade_points_cte.c.accuracy).label("avg_accuracy")
        )
        
        overall_stats = session.execute(overall_stats_stmt).fetchone()
        
        # 2. Accuracy by Category
        acc_cat_stmt = (
            select(
                Question.solo_taxonomy_label,
                func.count(Answer.answer_id).label("answer_count"),
                func.avg(Answer.accuracy).label("avg_accuracy")
            )
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(Answer, Question.question_id == Answer.question_id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_label.is_not(None),
                Answer.accuracy.is_not(None)
            )
            .group_by(Question.solo_taxonomy_label)
            .order_by(desc("avg_accuracy"))
        )
        accuracy_by_category = session.execute(acc_cat_stmt).fetchall()

        # 3. Questions by Category
        q_cat_stmt = (
            select(
                Question.solo_taxonomy_label,
                func.count(Question.question_id).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points")
            )
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_label.is_not(None)
            )
            .group_by(Question.solo_taxonomy_label)
            .order_by(desc("avg_grade_points"))
        )
        questions_by_category = session.execute(q_cat_stmt).fetchall()

        # 4. Grades by Topic
        g_topic_stmt = (
            select(
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Question.question_id).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points")
            )
            .select_from(Topic)
            .outerjoin(Question, Topic.id == Question.topic_id)
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == user_id, Question.grade.is_not(None))
            .group_by(Topic.id, Topic.topic_name)
            .order_by(desc("avg_grade_points"))
        )
        grades_by_topic = session.execute(g_topic_stmt).fetchall()

        # 5. Accuracy by Topic
        acc_topic_stmt = (
            select(
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.answer_id).label("answer_count"),
                func.avg(Answer.accuracy).label("avg_accuracy")
            )
            .select_from(Topic)
            .outerjoin(Answer, Topic.id == Answer.topic_id)
            .join(Question, Answer.question_id == Question.question_id)
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == user_id, Answer.accuracy.is_not(None))
            .group_by(Topic.id, Topic.topic_name)
            .order_by(desc("avg_accuracy"))
        )
        accuracy_by_topic = session.execute(acc_topic_stmt).fetchall()

        # 6. Time Series: Interactions
        interaction_ts_stmt = (
            select(
                cast(Conversation.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Message.message_id)).label("interaction_count")
            )
            .select_from(Conversation)
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.message_id == Question.message_id)
            .join(Topic, Question.topic_id == Topic.id)
            .where(Conversation.user_id == user_id)
            .group_by(cast(Conversation.created_at, Date), Topic.id, Topic.topic_name)
            .order_by("date", Topic.topic_name)
        )
        interactions_over_time_by_topic = session.execute(interaction_ts_stmt).fetchall()

        # 7. Time Series: Duration
        duration_ts_stmt = (
            select(
                cast(Conversation.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.avg(Conversation.updated_at - Conversation.created_at).label("avg_duration")
            )
            .select_from(Conversation)
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.message_id == Question.message_id)
            .join(Topic, Question.topic_id == Topic.id)
            .where(Conversation.user_id == user_id)
            .group_by(cast(Conversation.created_at, Date), Topic.id, Topic.topic_name)
            .order_by("date", Topic.topic_name)
        )
        duration_over_time_by_topic = session.execute(duration_ts_stmt).fetchall()

        # 8. Double Grouped: Accuracy
        acc_solo_topic_stmt = (
            select(
                Question.solo_taxonomy_label,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.answer_id).label("answer_count"),
                func.avg(Answer.accuracy).label("avg_accuracy")
            )
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(Answer, Question.question_id == Answer.question_id)
            .join(Topic, Question.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_label.is_not(None),
                Answer.accuracy.is_not(None)
            )
            .group_by(Question.solo_taxonomy_label, Topic.id, Topic.topic_name)
            .order_by(Topic.topic_name, Question.solo_taxonomy_label)
        )
        accuracy_by_solo_and_topic = session.execute(acc_solo_topic_stmt).fetchall()

        # 9. Double Grouped: Question Counts/Grades
        q_solo_topic_stmt = (
            select(
                Question.solo_taxonomy_label,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Question.question_id).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points")
            )
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(Topic, Question.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_label.is_not(None)
            )
            .group_by(Question.solo_taxonomy_label, Topic.id, Topic.topic_name)
            .order_by(Topic.topic_name, Question.solo_taxonomy_label)
        )
        questions_by_solo_and_topic = session.execute(q_solo_topic_stmt).fetchall()

        # Extract values
        conversation_duration = overall_stats.avg_duration if overall_stats else None
        conversation_number = overall_stats.conv_count if overall_stats else 0
        question_grade = overall_stats.avg_grade if overall_stats else None
        answer_accuracy = overall_stats.avg_accuracy if overall_stats else None
        
        return {
            'user_id': user_id,
            'conversation_duration': str(conversation_duration) if conversation_duration else None,
            'conversation_count': conversation_number,
            'average_question_grade': float(question_grade) if question_grade else None,
            'average_answer_accuracy': float(answer_accuracy) if answer_accuracy else None,
            'accuracy_by_solo_category': [{
                'category': row.solo_taxonomy_label,
                'answer_count': row.answer_count,
                'avg_accuracy': float(row.avg_accuracy) if row.avg_accuracy else None
            } for row in accuracy_by_category],
            'questions_by_solo_category': [{
                'category': row.solo_taxonomy_label,
                'question_count': row.question_count,
                'avg_grade_points': float(row.avg_grade_points) if row.avg_grade_points else None,
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points else 'N/A'
            } for row in questions_by_category],
            'grades_by_topic': [{
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_grade_points': float(row.avg_grade_points) if row.avg_grade_points else None,
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points else 'N/A'
            } for row in grades_by_topic],
            'accuracy_by_topic': [{
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': float(row.avg_accuracy) if row.avg_accuracy else None
            } for row in accuracy_by_topic],
            'interactions_over_time_by_topic': [{
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'interaction_count': row.interaction_count
            } for row in interactions_over_time_by_topic],
            'duration_over_time_by_topic': [{
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_duration': str(row.avg_duration) if row.avg_duration else None
            } for row in duration_over_time_by_topic],
            'accuracy_by_solo_and_topic': [{
                'solo_category': row.solo_taxonomy_label,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': float(row.avg_accuracy) if row.avg_accuracy else None
            } for row in accuracy_by_solo_and_topic],
            'questions_by_solo_and_topic': [{
                'solo_category': row.solo_taxonomy_label,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_grade_points': float(row.avg_grade_points) if row.avg_grade_points else None,
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points else 'N/A'
            } for row in questions_by_solo_and_topic]
        }
    finally:
        session.close()

def create_indexes_if_needed():
    """
    Creates database indexes using SQLAlchemy Core objects.
    checkfirst=True ensures we don't crash if the index already exists.
    """
    print("\n--- Ensuring Database Indexes Exist (SQLAlchemy Core) ---")
    
    # Define the indexes you want to ensure exist
    # Syntax: Index('index_name', ColumnObject, ...)
    indexes_to_create = [
        # Single column indexes
        Index("idx_conversation_user_id", Conversation.user_id),
        Index("idx_message_conversation_id", Message.conversation_id),
        Index("idx_question_message_id", Question.message_id),
        Index("idx_answer_question_id", Answer.question_id),
        Index("idx_question_solo_taxonomy", Question.solo_taxonomy_label),
        Index("idx_question_topic_id", Question.topic_id),
        Index("idx_answer_topic_id", Answer.topic_id),
        Index("idx_conversation_created_at", Conversation.created_at),
        
        # Composite index (Multi-column)
        Index("idx_conversation_user_created", Conversation.user_id, Conversation.created_at)
    ]

    # Create them bound to the engine
    for index in indexes_to_create:
        try:
            # checkfirst=True is the Python equivalent of "IF NOT EXISTS"
            index.create(engine, checkfirst=True)
            print(f"Verified index: {index.name}")
        except Exception as e:
            print(f"Skipping index {index.name}: {e}")

if __name__ == "__main__":
    start_time = time.perf_counter()
    
    create_indexes_if_needed()
    
    index_time = time.perf_counter()
    print(f"\nIndex creation: {(index_time - start_time)*1000:.2f}ms")

    # Get unique users via ORM
    session = SessionLocal()
    try:
        users_stmt = select(distinct(Conversation.user_id))
        users = session.execute(users_stmt).fetchall()
        print(f"\nAll user ids: {[row[0] for row in users]}")
    finally:
        session.close()
    
    # Test group statistics
    print("\n=== Testing Group Statistics ===")
    group_start = time.perf_counter()
    group_stats = group_statistics()
    group_end = time.perf_counter()
    print(f"Group statistics: {(group_end - group_start)*1000:.2f}ms")
    print(f"\nOverall Average Question Grade: {group_stats['overall_average_grade_letter']}")
    print(f"Overall Average Accuracy: {group_stats['overall_average_accuracy']:.2f}%" if group_stats['overall_average_accuracy'] else "No data")
    
    # Test individual statistics (Mock User 103)
    print("\n=== Testing Individual Statistics (User 103) ===")
    individual_start = time.perf_counter()
    individual_stats = individual_statistics(103)
    individual_end = time.perf_counter()
    print(f"⏱️  Individual statistics: {(individual_end - individual_start)*1000:.2f}ms")
    print(f"User 103 Average Question Grade: {individual_stats['average_question_grade']:.2f}" if individual_stats['average_question_grade'] else "No data")
    print(f"User 103 Average Answer Accuracy: {individual_stats['average_answer_accuracy']:.2f}%" if individual_stats['average_answer_accuracy'] else "No data")
    print(f"User 103 Conversation Count: {individual_stats['conversation_count']}")
    
    # Verification Query (ORM)
    print("\nUser 103 Questions by Solo Category:")
    session = SessionLocal()
    try:
        q_verify_stmt = (
            select(
                Question.question_id.label("question_id"),
                Question.solo_taxonomy_label,
                Question.grade
            )
            .join(Message, Question.message_id == Message.message_id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == 103)
            .order_by(Question.solo_taxonomy_label)
        )
        question_query = session.execute(q_verify_stmt).fetchall()
        for row in question_query:
            print(f" Question ID: {row.question_id}, Category: {row.solo_taxonomy_label}, Grade: {row.grade}")
    finally:
        session.close()
    
    total_time = time.perf_counter() - start_time
    print(f"\n{'='*50}")
    print(f"⏱️  TOTAL EXECUTION TIME: {total_time*1000:.2f}ms")
    print(f"{'='*50}")