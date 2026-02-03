import time
import decimal
import json
import gzip
from sqlalchemy import select, func, case, desc, cast, Date, distinct, and_, Index, BigInteger, Float
from dotenv import load_dotenv
from datetime import datetime, timedelta

# --- IMPORTS ---
from app.database.models import Base, User, Conversation, Message, Question, Subtopic, Answer, Topic, question_topics, question_subtopics
from app.database.session import get_db_session
from .grading_calculation import point_to_grade
from .redis_client import get_redis_client, get_redis_client_raw

load_dotenv()

def safe_float(val):
    if val is None:
        return None
    if isinstance(val, decimal.Decimal):
        return float(val)
    return float(val)

def timedelta_to_minutes(td):
    """Convert timedelta to minutes as float."""
    if td is None:
        return None
    if isinstance(td, timedelta):
        return td.total_seconds() / 60.0
    # If it's already a number, return as-is
    return float(td)

red_client = get_redis_client()

# --- REUSABLE EXPRESSIONS ---
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
    Optimized version (Sequential):
    1. Consolidates Grade, Accuracy, and Conversation Counts by Topic into a single query.
    2. Consolidates Solo Taxonomy stats into a single query.
    3. Executes queries sequentially with caching.
    """
    CACHE_KEY = "dashboard:group_statistics"
    
    try:
        red_client_raw = get_redis_client_raw()
        cached_data = red_client_raw.get(CACHE_KEY)
        if cached_data:
            print("=== Using Cached Group Statistics ===")
            decompressed = gzip.decompress(cached_data)
            return json.loads(decompressed.decode('utf-8'))
    except Exception as e:
        print(f"[WARN] Redis error: {e}")

    print("=== No Cache Found. Calculating Group Statistics (Sequential) ===")
    
    session = get_db_session()
    try:
        # 1. Global Scalar Stats
        global_scalars_query = select(
            func.avg(grade_points_expr).label("avg_grade"),
            func.avg(Answer.accuracy_score).label("avg_accuracy")
        ).select_from(Question).outerjoin(Answer, Question.id == Answer.question_id)
        
        global_res = session.execute(global_scalars_query).fetchone()

        # 2. Avg Duration (Fixed: Group by Conversation.id for proper duration)
        duration_subq = (
            select((func.max(Message.timestamp) - func.min(Message.timestamp)).label('duration'))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .group_by(Conversation.id)
            .subquery()
        )
        avg_duration_query = select(func.avg(duration_subq.c.duration))
        duration_res = session.execute(avg_duration_query).scalar()

        # 3. User Conversation Counts
        user_conv_counts_query = (
            select(Conversation.user_id, func.count(Conversation.id).label('count'))
            .group_by(Conversation.user_id)
        )
        user_counts_res = session.execute(user_conv_counts_query).fetchall()
        
        # Get total number of ACTIVE users for average calculation (only users who have asked questions)
        # Optimized: removed User table join, use Conversation.user_id directly
        active_users_query = (
            select(func.count(distinct(Conversation.user_id)))
            .select_from(Conversation)
            .join(Message, Message.conversation_id == Conversation.id)
            .join(Question, Question.message_id == Message.id)
            .join(Answer, Answer.question_id == Question.id)
        )
        total_users = session.execute(active_users_query).scalar() or 1

        # 4. Topic Stats (Merged) - Calculate average conversations per user
        topic_stats_query = (
            select(
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points"),
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy"),
                func.count(distinct(Conversation.id)).label("total_conversations"),
                (func.count(distinct(Conversation.id)).cast(Float) / total_users).label("avg_conversations_per_user")
            )
            .select_from(Topic)
            .join(question_topics, Topic.id == question_topics.c.topic_id)
            .join(Question, question_topics.c.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .group_by(Topic.id, Topic.topic_name)
        )
        topic_stats_res = session.execute(topic_stats_query).fetchall()

        # 5. Solo + Topic Stats
        solo_topic_stats_query = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points"),
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Topic)
            .join(question_topics, Topic.id == question_topics.c.topic_id)
            .join(Question, question_topics.c.question_id == Question.id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .where(Question.solo_taxonomy_level.is_not(None))
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        solo_stats_res = session.execute(solo_topic_stats_query).fetchall()

        # 6. Interactions Time Series
        daily_interactions_subq = (
            select(
                Conversation.user_id,
                cast(Message.timestamp, Date).label("date"),
                Topic.id.label("topic_id"),
                func.count(distinct(Message.id)).label("interaction_count")
            )
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(Question, Message.id == Question.message_id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .group_by(Conversation.user_id, cast(Message.timestamp, Date), Topic.id)
            .subquery()
        )

        ts_interactions_query = (
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
        ts_interaction_res = session.execute(ts_interactions_query).fetchall()

        # 7. Duration Time Series (Fixed: Use message timestamps per conversation)
        conversation_duration_subq = (
            select(
                Conversation.id.label("conversation_id"),
                cast(func.min(Message.timestamp), Date).label("date"),
                (func.max(Message.timestamp) - func.min(Message.timestamp)).label("duration")
            )
            .join(Message, Conversation.id == Message.conversation_id)
            .group_by(Conversation.id)
            .subquery()
        )
        
        ts_duration_query = (
            select(
                conversation_duration_subq.c.date,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.avg(conversation_duration_subq.c.duration).label("avg_duration")
            )
            .select_from(conversation_duration_subq)
            .join(Conversation, conversation_duration_subq.c.conversation_id == Conversation.id)
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.id == Question.message_id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .group_by(conversation_duration_subq.c.date, Topic.id, Topic.topic_name)
            .order_by(conversation_duration_subq.c.date, Topic.topic_name)
        )
        ts_duration_res = session.execute(ts_duration_query).fetchall()

        # 8. Question Grades Over Time (New - Group Average)
        # Calculate daily average per user, then average those
        daily_grades_subq = (
            select(
                Conversation.user_id,
                cast(Question.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                func.avg(grade_points_expr).label("user_avg_grade")
            )
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Question.grade.is_not(None))
            .group_by(Conversation.user_id, cast(Question.created_at, Date), Topic.id)
            .subquery()
        )
        
        ts_grades_query = (
            select(
                daily_grades_subq.c.date,
                daily_grades_subq.c.topic_id,
                Topic.topic_name,
                func.avg(daily_grades_subq.c.user_avg_grade).label("avg_grade_points")
            )
            .join(Topic, daily_grades_subq.c.topic_id == Topic.id)
            .group_by(daily_grades_subq.c.date, daily_grades_subq.c.topic_id, Topic.topic_name)
            .order_by(daily_grades_subq.c.date, Topic.topic_name)
        )
        ts_grades_res = session.execute(ts_grades_query).fetchall()

        # 9. Answer Accuracy Over Time (New - Group Average)
        daily_accuracy_subq = (
            select(
                Conversation.user_id,
                cast(Answer.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Answer.accuracy_score.is_not(None))
            .group_by(Conversation.user_id, cast(Answer.created_at, Date), Topic.id)
            .subquery()
        )
        
        ts_accuracy_query = (
            select(
                daily_accuracy_subq.c.date,
                daily_accuracy_subq.c.topic_id,
                Topic.topic_name,
                func.avg(daily_accuracy_subq.c.user_avg_accuracy).label("avg_accuracy")
            )
            .join(Topic, daily_accuracy_subq.c.topic_id == Topic.id)
            .group_by(daily_accuracy_subq.c.date, daily_accuracy_subq.c.topic_id, Topic.topic_name)
            .order_by(daily_accuracy_subq.c.date, Topic.topic_name)
        )
        ts_accuracy_res = session.execute(ts_accuracy_query).fetchall()

        # 10. SOLO Taxonomy Stats by Time Range (for bar charts - aggregated by category, no dates)
        from datetime import datetime, timedelta
        three_days_ago = datetime.now() - timedelta(days=3)
        one_week_ago = datetime.now() - timedelta(days=7)

       
        # --- ALL TIME: Questions by SOLO Category ---
        # Step 1: Count total questions per user per SOLO category
        user_solo_questions_subq_all = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Question.solo_taxonomy_level.is_not(None))
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )

        # Step 2: Average across users
        ts_solo_questions_query_all = (
            select(
                user_solo_questions_subq_all.c.solo_taxonomy_level,
                func.avg(user_solo_questions_subq_all.c.question_count).label("avg_question_count")
            )
            .group_by(user_solo_questions_subq_all.c.solo_taxonomy_level))
       
        # --- ALL TIME: Questions by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        user_solo_questions_topic_subq_all = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Question.solo_taxonomy_level.is_not(None))
            .group_by(Conversation.user_id, Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
            .subquery()
        )

        ts_solo_questions_topic_query_all = (
            select(
                user_solo_questions_topic_subq_all.c.solo_taxonomy_level,
                user_solo_questions_topic_subq_all.c.topic_id,
                user_solo_questions_topic_subq_all.c.topic_name,
                func.avg(user_solo_questions_topic_subq_all.c.question_count).label("avg_question_count")
            )
            .group_by(
                user_solo_questions_topic_subq_all.c.solo_taxonomy_level,
                user_solo_questions_topic_subq_all.c.topic_id,
                user_solo_questions_topic_subq_all.c.topic_name
            )
        )
        ts_solo_questions_topic_res_all = session.execute(ts_solo_questions_topic_query_all).fetchall()
        
        # Global query (all topics combined)
        user_solo_questions_subq_all = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Question.solo_taxonomy_level.is_not(None))
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )

        ts_solo_questions_query_all = (
            select(
                user_solo_questions_subq_all.c.solo_taxonomy_level,
                func.avg(user_solo_questions_subq_all.c.question_count).label("avg_question_count")
            )
            .group_by(user_solo_questions_subq_all.c.solo_taxonomy_level)
        )
        ts_solo_questions_res_all = session.execute(ts_solo_questions_query_all).fetchall()

        print("\n=== BACKEND GROUP: ALL TIME Questions by SOLO (Global) ===")
        for row in ts_solo_questions_res_all:
            print(f"  {row.solo_taxonomy_level}: {row.avg_question_count:.2f}")

        # --- PAST 3 DAYS: Questions by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        user_solo_questions_topic_subq_3d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= three_days_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
            .subquery()
        )

        ts_solo_questions_topic_query_3d = (
            select(
                user_solo_questions_topic_subq_3d.c.solo_taxonomy_level,
                user_solo_questions_topic_subq_3d.c.topic_id,
                user_solo_questions_topic_subq_3d.c.topic_name,
                func.avg(user_solo_questions_topic_subq_3d.c.question_count).label("avg_question_count")
            )
            .group_by(
                user_solo_questions_topic_subq_3d.c.solo_taxonomy_level,
                user_solo_questions_topic_subq_3d.c.topic_id,
                user_solo_questions_topic_subq_3d.c.topic_name
            )
        )
        ts_solo_questions_topic_res_3d = session.execute(ts_solo_questions_topic_query_3d).fetchall()
        
        # Global query
        user_solo_questions_subq_3d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= three_days_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )

        ts_solo_questions_query_3d = (
            select(
                user_solo_questions_subq_3d.c.solo_taxonomy_level,
                func.avg(user_solo_questions_subq_3d.c.question_count).label("avg_question_count")
            )
            .group_by(user_solo_questions_subq_3d.c.solo_taxonomy_level)
        )
        ts_solo_questions_res_3d = session.execute(ts_solo_questions_query_3d).fetchall()

        print("\n=== BACKEND GROUP: PAST 3 DAYS Questions by SOLO (Global) ===")
        for row in ts_solo_questions_res_3d:
            print(f"  {row.solo_taxonomy_level}: {row.avg_question_count:.2f}")

        # --- PAST WEEK: Questions by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        user_solo_questions_topic_subq_7d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= one_week_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
            .subquery()
        )

        ts_solo_questions_topic_query_7d = (
            select(
                user_solo_questions_topic_subq_7d.c.solo_taxonomy_level,
                user_solo_questions_topic_subq_7d.c.topic_id,
                user_solo_questions_topic_subq_7d.c.topic_name,
                func.avg(user_solo_questions_topic_subq_7d.c.question_count).label("avg_question_count")
            )
            .group_by(
                user_solo_questions_topic_subq_7d.c.solo_taxonomy_level,
                user_solo_questions_topic_subq_7d.c.topic_id,
                user_solo_questions_topic_subq_7d.c.topic_name
            )
        )
        ts_solo_questions_topic_res_7d = session.execute(ts_solo_questions_topic_query_7d).fetchall()
        
        # Global query
        user_solo_questions_subq_7d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= one_week_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )

        ts_solo_questions_query_7d = (
            select(
                user_solo_questions_subq_7d.c.solo_taxonomy_level,
                func.avg(user_solo_questions_subq_7d.c.question_count).label("avg_question_count")
            )
            .group_by(user_solo_questions_subq_7d.c.solo_taxonomy_level)
        )
        ts_solo_questions_res_7d = session.execute(ts_solo_questions_query_7d).fetchall()

        print("\n=== BACKEND GROUP: PAST WEEK Questions by SOLO (Global) ===")
        for row in ts_solo_questions_res_7d:
            print(f"  {row.solo_taxonomy_level}: {row.avg_question_count:.2f}")


        # --- ALL TIME: Accuracy by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        user_solo_accuracy_topic_subq_all = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Question.solo_taxonomy_level.is_not(None), Answer.accuracy_score.is_not(None))
            .group_by(Conversation.user_id, Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
            .subquery()
        )
        ts_solo_accuracy_topic_query_all = (
            select(
                user_solo_accuracy_topic_subq_all.c.solo_taxonomy_level,
                user_solo_accuracy_topic_subq_all.c.topic_id,
                user_solo_accuracy_topic_subq_all.c.topic_name,
                func.sum(user_solo_accuracy_topic_subq_all.c.answer_count).label("answer_count"),
                func.avg(user_solo_accuracy_topic_subq_all.c.user_avg_accuracy).label("avg_accuracy")
            )
            .group_by(
                user_solo_accuracy_topic_subq_all.c.solo_taxonomy_level,
                user_solo_accuracy_topic_subq_all.c.topic_id,
                user_solo_accuracy_topic_subq_all.c.topic_name
            )
        )
        ts_solo_accuracy_topic_res_all = session.execute(ts_solo_accuracy_topic_query_all).fetchall()
        
        # Global query (all topics)
        user_solo_accuracy_subq_all = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Question.solo_taxonomy_level.is_not(None), Answer.accuracy_score.is_not(None))
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )
        ts_solo_accuracy_query_all = (
            select(
                user_solo_accuracy_subq_all.c.solo_taxonomy_level,
                func.sum(user_solo_accuracy_subq_all.c.answer_count).label("answer_count"),
                func.avg(user_solo_accuracy_subq_all.c.user_avg_accuracy).label("avg_accuracy")
            )
            .group_by(user_solo_accuracy_subq_all.c.solo_taxonomy_level)
        )
        ts_solo_accuracy_res_all = session.execute(ts_solo_accuracy_query_all).fetchall()
        
        print("\n=== BACKEND: ALL TIME Accuracy by SOLO (Global) ===")
        for row in ts_solo_accuracy_res_all:
            if row.answer_count > 0:
                print(f"  {row.solo_taxonomy_level}: {row.avg_accuracy:.2f}%")

        # --- PAST 3 DAYS: Accuracy by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        user_solo_accuracy_topic_subq_3d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= three_days_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
            .subquery()
        )
        ts_solo_accuracy_topic_query_3d = (
            select(
                user_solo_accuracy_topic_subq_3d.c.solo_taxonomy_level,
                user_solo_accuracy_topic_subq_3d.c.topic_id,
                user_solo_accuracy_topic_subq_3d.c.topic_name,
                func.sum(user_solo_accuracy_topic_subq_3d.c.answer_count).label("answer_count"),
                func.avg(user_solo_accuracy_topic_subq_3d.c.user_avg_accuracy).label("avg_accuracy")
            )
            .group_by(
                user_solo_accuracy_topic_subq_3d.c.solo_taxonomy_level,
                user_solo_accuracy_topic_subq_3d.c.topic_id,
                user_solo_accuracy_topic_subq_3d.c.topic_name
            )
        )
        ts_solo_accuracy_topic_res_3d = session.execute(ts_solo_accuracy_topic_query_3d).fetchall()
        
        # Global query
        user_solo_accuracy_subq_3d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= three_days_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )
        ts_solo_accuracy_query_3d = (
            select(
                user_solo_accuracy_subq_3d.c.solo_taxonomy_level,
                func.sum(user_solo_accuracy_subq_3d.c.answer_count).label("answer_count"),
                func.avg(user_solo_accuracy_subq_3d.c.user_avg_accuracy).label("avg_accuracy")
            )
            .group_by(user_solo_accuracy_subq_3d.c.solo_taxonomy_level)
        )
        ts_solo_accuracy_res_3d = session.execute(ts_solo_accuracy_query_3d).fetchall()
        
        print("\n=== BACKEND: PAST 3 DAYS Accuracy by SOLO (Global) ===")
        for row in ts_solo_accuracy_res_3d:
            if row.answer_count > 0:
                print(f"  {row.solo_taxonomy_level}: {row.avg_accuracy:.2f}%")

        # --- PAST WEEK: Accuracy by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        user_solo_accuracy_topic_subq_7d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= one_week_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
            .subquery()
        )
        ts_solo_accuracy_topic_query_7d = (
            select(
                user_solo_accuracy_topic_subq_7d.c.solo_taxonomy_level,
                user_solo_accuracy_topic_subq_7d.c.topic_id,
                user_solo_accuracy_topic_subq_7d.c.topic_name,
                func.sum(user_solo_accuracy_topic_subq_7d.c.answer_count).label("answer_count"),
                func.avg(user_solo_accuracy_topic_subq_7d.c.user_avg_accuracy).label("avg_accuracy")
            )
            .group_by(
                user_solo_accuracy_topic_subq_7d.c.solo_taxonomy_level,
                user_solo_accuracy_topic_subq_7d.c.topic_id,
                user_solo_accuracy_topic_subq_7d.c.topic_name
            )
        )
        ts_solo_accuracy_topic_res_7d = session.execute(ts_solo_accuracy_topic_query_7d).fetchall()
        
        # Global query
        user_solo_accuracy_subq_7d = (
            select(
                Conversation.user_id,
                Question.solo_taxonomy_level,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("user_avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= one_week_ago
            )
            .group_by(Conversation.user_id, Question.solo_taxonomy_level)
            .subquery()
        )
        ts_solo_accuracy_query_7d = (
            select(
                user_solo_accuracy_subq_7d.c.solo_taxonomy_level,
                func.sum(user_solo_accuracy_subq_7d.c.answer_count).label("answer_count"),
                func.avg(user_solo_accuracy_subq_7d.c.user_avg_accuracy).label("avg_accuracy")
            )
            .group_by(user_solo_accuracy_subq_7d.c.solo_taxonomy_level)
        )
        ts_solo_accuracy_res_7d = session.execute(ts_solo_accuracy_query_7d).fetchall()
        
        print("\n=== BACKEND: PAST WEEK Accuracy by SOLO ===")
        for row in ts_solo_accuracy_res_7d:
            if row.answer_count > 0:
                print(f"  {row.solo_taxonomy_level}: {row.avg_accuracy:.2f}%")

        # --- PROCESS RESULTS ---
        total_convs = sum(row.count for row in user_counts_res)
        total_users = len(user_counts_res)
        avg_conv_per_user = total_convs / total_users if total_users > 0 else 0

        stats = {
            'average_conversation_duration': str(duration_res) if duration_res else None,
            'conversations_per_user': [{'user_id': row[0], 'count': row[1]} for row in user_counts_res],
            'average_conversations_per_user': float(avg_conv_per_user),
            'overall_average_grade': safe_float(global_res.avg_grade) if global_res else None,
            # CRITICAL FIX: Explicit check for None to handle 0.0 (F grade) correctly
            'overall_average_grade_letter': point_to_grade(global_res.avg_grade) if global_res and global_res.avg_grade is not None else 'N/A',
            'overall_average_accuracy': safe_float(global_res.avg_accuracy) if global_res else None,
        }

        stats['grades_by_topic'] = sorted([
            {
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_grade_points': safe_float(row.avg_grade_points),
                # CRITICAL FIX: Explicit check for None to handle 0.0 (F grade) correctly
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points is not None else 'N/A'
            } for row in topic_stats_res
        ], key=lambda x: x['avg_grade_points'] or 0, reverse=True)
        
        stats['accuracy_by_topic'] = sorted([
            {
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in topic_stats_res if row.answer_count > 0
        ], key=lambda x: x['avg_accuracy'] or 0, reverse=True)

        stats['conversations_by_topic'] = sorted([
            {
                'topic_name': row.topic_name,
                'total_conversations': row.total_conversations,
                'avg_conversations_per_user': safe_float(row.avg_conversations_per_user)
            } for row in topic_stats_res
        ], key=lambda x: x['total_conversations'], reverse=True)
        
        # Answered questions per topic for reflective bar chart
        # Optimized: derive from existing topic_stats_res instead of separate query
        stats['answered_questions_by_topic'] = sorted([
            {
                'topic_name': row.topic_name,
                'total_answered_questions': row.answer_count,
                'avg_answered_per_user': round(row.answer_count / total_users) if total_users > 0 else 0
            } for row in topic_stats_res if row.answer_count > 0
        ], key=lambda x: x['total_answered_questions'], reverse=True)

        # Questions per solo category for Number of Questions per Category chart
        # Optimized: derive from time-filtered all_time data instead of separate query
        stats['avg_questions_by_solo_category'] = sorted([
            {
                'solo_category': row.solo_taxonomy_level,
                'total_question_count': safe_float(row.avg_question_count) * total_users,
                'avg_questions_per_user': round(safe_float(row.avg_question_count)) if row.avg_question_count else 0
            } for row in ts_solo_questions_res_all
        ], key=lambda x: x['total_question_count'], reverse=True)

       

        stats['avg_questions_by_solo_and_topic'] = [
            {
                'solo_category': row.solo_taxonomy_level,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_questions_per_user': round(row.question_count / total_users) if total_users > 0 else 0,
                'avg_grade_points': safe_float(row.avg_grade_points),
                # CRITICAL FIX: Explicit check for None
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points is not None else 'N/A'
            } for row in solo_stats_res
        ]
        
        stats['avg_accuracy_by_solo_and_topic'] = [
            {
                'solo_category': row.solo_taxonomy_level,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in solo_stats_res if row.answer_count > 0
        ]

        stats['avg_interactions_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_interaction_count': round(row.avg_interaction_count) if row.avg_interaction_count else 0
            } for row in ts_interaction_res
        ]

        stats['avg_duration_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_duration': timedelta_to_minutes(row.avg_duration)
            } for row in ts_duration_res
        ]

        # New time series data for grades and accuracy
        stats['avg_grades_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_grade_points': safe_float(row.avg_grade_points)
            } for row in ts_grades_res
        ]
        
        stats['avg_accuracy_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in ts_accuracy_res
        ]

        # SOLO taxonomy stats by time range (with topic breakdown + global)
        # Structure: Each timeframe contains array with topic_id/topic_name (null for global)
        stats['questions_by_solo_over_time'] = {
            'all_time': (
                # Global (all topics)
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'question_count': safe_float(row.avg_question_count)
                } for row in ts_solo_questions_res_all] +
                # Per-topic breakdown
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'question_count': safe_float(row.avg_question_count)
                } for row in ts_solo_questions_topic_res_all]
            ),
            'past_3_days': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'question_count': safe_float(row.avg_question_count)
                } for row in ts_solo_questions_res_3d] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'question_count': safe_float(row.avg_question_count)
                } for row in ts_solo_questions_topic_res_3d]
            ),
            'past_week': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'question_count': safe_float(row.avg_question_count)
                } for row in ts_solo_questions_res_7d] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'question_count': safe_float(row.avg_question_count)
                } for row in ts_solo_questions_topic_res_7d]
            )
        }
        
        stats['accuracy_by_solo_over_time'] = {
            'all_time': (
                # Global (all topics)
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_res_all if row.answer_count > 0] +
                # Per-topic breakdown
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_topic_res_all if row.answer_count > 0]
            ),
            'past_3_days': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_res_3d if row.answer_count > 0] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_topic_res_3d if row.answer_count > 0]
            ),
            'past_week': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_res_7d if row.answer_count > 0] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_topic_res_7d if row.answer_count > 0]
            )
        }

        try:
            compressed_data = gzip.compress(json.dumps(stats).encode('utf-8'))
            red_client.setex(CACHE_KEY, 3600, compressed_data)
            print("=== Cached Group Statistics Successfully===")
        except Exception as ex:
            print(f"[WARN] Failed to cache group stats: {ex}")

        return stats

    finally:
        session.close()

def individual_statistics(user_id):
    """
    Optimized version (Sequential):
    Calculates stats for a single user without multi-threading.
    """
    CACHE_KEY = f"dashboard:individual_stats:user:{user_id}"
    
    try:
        red_client_raw = get_redis_client_raw()
        cached_data = red_client_raw.get(CACHE_KEY)
        if cached_data:
            print(f"=== Using Cached Stats for User {user_id} ===")
            decompressed = gzip.decompress(cached_data)
            return json.loads(decompressed.decode('utf-8'))
    except Exception as e:
        print(f"[WARN] Redis error: {e}")

    print(f"=== Calculating Individual Stats for {user_id} (Sequential) ===")
    
    session = get_db_session()
    try:
        # 1. Overall Stats
        overall_query = (
            select(
                func.count(distinct(Conversation.id)).label("conv_count"),
                func.avg(grade_points_expr).label("avg_grade"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Conversation)
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.id == Question.message_id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .where(Conversation.user_id == user_id)
            .group_by(Conversation.user_id)
        )
        overall_res = session.execute(overall_query).fetchone()

        # 2. Avg Duration
        duration_subq = (
            select((func.max(Message.timestamp) - func.min(Message.timestamp)).label("duration"))
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == user_id)
            .group_by(Conversation.id)
            .subquery()
        )
        duration_query = select(func.avg(duration_subq.c.duration))
        duration_res = session.execute(duration_query).scalar()

        # 3. Topic Stats
        topic_stats_query = (
            select(
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points"),
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Topic)
            .join(question_topics, Topic.id == question_topics.c.topic_id)
            .join(Question, question_topics.c.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .where(Conversation.user_id == user_id)
            .group_by(Topic.id, Topic.topic_name)
        )
        subtopic_stats_query = (
            select(
                Subtopic.id.label("topic_id"),
                Subtopic.subtopic_name.label("topic_name"), # Alias to match structure
                func.count(distinct(Question.id)).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points"),
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Subtopic)
            .join(question_subtopics, Subtopic.id == question_subtopics.c.subtopic_id) 
            .join(Question, question_subtopics.c.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .where(Conversation.user_id == user_id)
            .group_by(Subtopic.id, Subtopic.subtopic_name)
        )
        subtopic_res = session.execute(subtopic_stats_query).fetchall()
       #  breakpoint()
        topic_res = session.execute(topic_stats_query).fetchall()

        # 4. Solo Stats
        solo_stats_query = (
            select(
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points"),
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .where(Conversation.user_id == user_id, Question.solo_taxonomy_level.is_not(None))
            .group_by(Question.solo_taxonomy_level)
        )
        solo_res = session.execute(solo_stats_query).fetchall()

        # 5. Solo + Topic
        solo_topic_query = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count"),
                func.avg(grade_points_expr).label("avg_grade_points"),
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Topic)
            .join(question_topics, Topic.id == question_topics.c.topic_id)
            .join(Question, question_topics.c.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .outerjoin(Answer, Question.id == Answer.question_id)
            .where(Conversation.user_id == user_id, Question.solo_taxonomy_level.is_not(None))
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        solo_topic_res = session.execute(solo_topic_query).fetchall()

        # 5b. SOLO Taxonomy Stats by Time Range (for bar charts - aggregated by category, no dates)
        from datetime import datetime, timedelta
        three_days_ago = datetime.now() - timedelta(days=3)
        one_week_ago = datetime.now() - timedelta(days=7)

        # --- ALL TIME: Questions by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        ts_solo_questions_topic_query_all = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Conversation.user_id == user_id, Question.solo_taxonomy_level.is_not(None))
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        ts_solo_questions_topic_res_all = session.execute(ts_solo_questions_topic_query_all).fetchall()
        
        # Global query (all topics)
        ts_solo_questions_query_all = (
            select(
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == user_id, Question.solo_taxonomy_level.is_not(None))
            .group_by(Question.solo_taxonomy_level)
        )
        ts_solo_questions_res_all = session.execute(ts_solo_questions_query_all).fetchall()

        # --- PAST 3 DAYS: Questions by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        ts_solo_questions_topic_query_3d = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= three_days_ago
            )
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        ts_solo_questions_topic_res_3d = session.execute(ts_solo_questions_topic_query_3d).fetchall()
        
        # Global query
        ts_solo_questions_query_3d = (
            select(
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= three_days_ago
            )
            .group_by(Question.solo_taxonomy_level)
        )
        ts_solo_questions_res_3d = session.execute(ts_solo_questions_query_3d).fetchall()

        # --- PAST WEEK: Questions by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        ts_solo_questions_topic_query_7d = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= one_week_ago
            )
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        ts_solo_questions_topic_res_7d = session.execute(ts_solo_questions_topic_query_7d).fetchall()
        
        # Global query
        ts_solo_questions_query_7d = (
            select(
                Question.solo_taxonomy_level,
                func.count(distinct(Question.id)).label("question_count")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Question.created_at >= one_week_ago
            )
            .group_by(Question.solo_taxonomy_level)
        )
        ts_solo_questions_res_7d = session.execute(ts_solo_questions_query_7d).fetchall()

        # --- ALL TIME: Accuracy by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        ts_solo_accuracy_topic_query_all = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None)
            )
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        ts_solo_accuracy_topic_res_all = session.execute(ts_solo_accuracy_topic_query_all).fetchall()
        
        # Global query
        ts_solo_accuracy_query_all = (
            select(
                Question.solo_taxonomy_level,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None)
            )
            .group_by(Question.solo_taxonomy_level)
        )
        ts_solo_accuracy_res_all = session.execute(ts_solo_accuracy_query_all).fetchall()

        # --- PAST 3 DAYS: Accuracy by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        ts_solo_accuracy_topic_query_3d = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= three_days_ago
            )
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        ts_solo_accuracy_topic_res_3d = session.execute(ts_solo_accuracy_topic_query_3d).fetchall()
        
        # Global query
        ts_solo_accuracy_query_3d = (
            select(
                Question.solo_taxonomy_level,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= three_days_ago
            )
            .group_by(Question.solo_taxonomy_level)
        )
        ts_solo_accuracy_res_3d = session.execute(ts_solo_accuracy_query_3d).fetchall()

        # --- PAST WEEK: Accuracy by SOLO Category (with topic breakdown + global) ---
        # Query with topic breakdown
        ts_solo_accuracy_topic_query_7d = (
            select(
                Question.solo_taxonomy_level,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= one_week_ago
            )
            .group_by(Question.solo_taxonomy_level, Topic.id, Topic.topic_name)
        )
        ts_solo_accuracy_topic_res_7d = session.execute(ts_solo_accuracy_topic_query_7d).fetchall()
        
        # Global query
        ts_solo_accuracy_query_7d = (
            select(
                Question.solo_taxonomy_level,
                func.count(Answer.id).label("answer_count"),
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(
                Conversation.user_id == user_id,
                Question.solo_taxonomy_level.is_not(None),
                Answer.accuracy_score.is_not(None),
                Answer.created_at >= one_week_ago
            )
            .group_by(Question.solo_taxonomy_level)
        )
        ts_solo_accuracy_res_7d = session.execute(ts_solo_accuracy_query_7d).fetchall()

        # 6. Interactions Time Series
        daily_interactions_subq = (
            select(
                Conversation.user_id,
                cast(Message.timestamp, Date).label("date"),
                Topic.id.label("topic_id"),
                func.count(distinct(Message.id)).label("interaction_count")
            )
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(Question, Message.id == Question.message_id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .group_by(Conversation.user_id, cast(Message.timestamp, Date), Topic.id)
            .subquery()
        )
        ts_interactions_query = (
            select(
                daily_interactions_subq.c.date,
                daily_interactions_subq.c.topic_id,
                Topic.topic_name,
                func.avg(daily_interactions_subq.c.interaction_count).label("avg_interaction_count")
            )
            .join(Topic, daily_interactions_subq.c.topic_id == Topic.id)
            .where(daily_interactions_subq.c.user_id == user_id)
            .group_by(daily_interactions_subq.c.date, daily_interactions_subq.c.topic_id, Topic.topic_name)
            .order_by(daily_interactions_subq.c.date, Topic.topic_name)
        )
        ts_interaction_res = session.execute(ts_interactions_query).fetchall()

        # 7. Duration Time Series 
        conversation_duration_subq = (
            select(
                Conversation.id.label("conversation_id"),
                cast(func.min(Message.timestamp), Date).label("date"),
                (func.max(Message.timestamp) - func.min(Message.timestamp)).label("duration")
            )
            .join(Message, Conversation.id == Message.conversation_id)
            .where(Conversation.user_id == user_id)
            .group_by(Conversation.id)
            .subquery()
        )
        
        ts_duration_query = (
            select(
                conversation_duration_subq.c.date,
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.avg(conversation_duration_subq.c.duration).label("avg_duration")
            )
            .select_from(conversation_duration_subq)
            .join(Conversation, conversation_duration_subq.c.conversation_id == Conversation.id)
            .join(Message, Conversation.id == Message.conversation_id)
            .join(Question, Message.id == Question.message_id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .group_by(conversation_duration_subq.c.date, Topic.id, Topic.topic_name)
            .order_by(conversation_duration_subq.c.date, Topic.topic_name)
        )
        ts_duration_res = session.execute(ts_duration_query).fetchall()

        # 8. Question Grades Over Time (New)
        ts_grades_query = (
            select(
                cast(Question.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.avg(grade_points_expr).label("avg_grade_points")
            )
            .select_from(Question)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Conversation.user_id == user_id, Question.grade.is_not(None))
            .group_by(cast(Question.created_at, Date), Topic.id, Topic.topic_name)
            .order_by(cast(Question.created_at, Date), Topic.topic_name)
        )
        ts_grades_res = session.execute(ts_grades_query).fetchall()

        # 9. Answer Accuracy Over Time (New)
        ts_accuracy_query = (
            select(
                cast(Answer.created_at, Date).label("date"),
                Topic.id.label("topic_id"),
                Topic.topic_name,
                func.avg(Answer.accuracy_score).label("avg_accuracy")
            )
            .select_from(Answer)
            .join(Question, Answer.question_id == Question.id)
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .join(question_topics, Question.id == question_topics.c.question_id)
            .join(Topic, question_topics.c.topic_id == Topic.id)
            .where(Conversation.user_id == user_id, Answer.accuracy_score.is_not(None))
            .group_by(cast(Answer.created_at, Date), Topic.id, Topic.topic_name)
            .order_by(cast(Answer.created_at, Date), Topic.topic_name)
        )
        ts_accuracy_res = session.execute(ts_accuracy_query).fetchall()

        # --- PROCESS RESULTS ---
        def safe_float(val):

            if val is None:
                return None
            if isinstance(val, decimal.Decimal):
                return float(val)
            return float(val)

        stats = {
            'user_id': user_id,
            'conversation_count': overall_res.conv_count if overall_res else 0,
            'conversation_duration': str(duration_res) if duration_res else None,
            'average_question_grade': safe_float(overall_res.avg_grade) if overall_res else None,
            'average_answer_accuracy': safe_float(overall_res.avg_accuracy) if overall_res else None,
            'overall_average_grade_letter': point_to_grade(overall_res.avg_grade) if overall_res and overall_res.avg_grade is not None else 'N/A'
        }
        topics_list = [
            {
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'type': 'topic',  # <--- MANUALLY ASSIGN TYPE
                'question_count': row.question_count,
                'avg_grade_points': safe_float(row.avg_grade_points),
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points is not None else 'N/A'
            } for row in topic_res
        ]

        subtopics_list = [
            {
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'type': 'subtopic', # <--- MANUALLY ASSIGN TYPE
                'question_count': row.question_count,
                'avg_grade_points': safe_float(row.avg_grade_points),
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points is not None else 'N/A'
            } for row in subtopic_res
        ]

        stats['grades_by_topic'] = topics_list
        stats['node_data'] = topics_list + subtopics_list
        # breakpoint()
        stats['accuracy_by_topic'] = sorted([
            {
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in topic_res if row.answer_count > 0 
        ], key=lambda x: x['avg_accuracy'] or 0, reverse=True)
        
        # Answered questions per topic for reflective bar chart comparison
        stats['answered_questions_by_topic'] = sorted([
            {
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answered_question_count': row.answer_count
            } for row in topic_res if row.answer_count > 0
        ], key=lambda x: x['answered_question_count'], reverse=True)
        
        # Questions per solo category for Number of Questions per Category chart
        stats['questions_by_solo_category'] = sorted([
            {
                'solo_category': row.solo_taxonomy_level,
                'question_count': row.question_count
            } for row in solo_res
        ], key=lambda x: x['question_count'], reverse=True)
        
        stats['questions_by_solo_category_old'] = [
            {
                'category': row.solo_taxonomy_level,
                'question_count': row.question_count,
                'avg_grade_points': safe_float(row.avg_grade_points),
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points is not None else 'N/A'
            } for row in solo_res
        ]
        stats['accuracy_by_solo_category'] = [
            {
                'category': row.solo_taxonomy_level,
                'answer_count': row.answer_count,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in solo_res if row.answer_count > 0
        ]

        stats['questions_by_solo_and_topic'] = [
            {
                'solo_category': row.solo_taxonomy_level,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'question_count': row.question_count,
                'avg_grade_points': safe_float(row.avg_grade_points),
                # CRITICAL FIX: Explicit check for None
                'avg_grade_letter': point_to_grade(row.avg_grade_points) if row.avg_grade_points is not None else 'N/A'
            } for row in solo_topic_res
        ]
        stats['accuracy_by_solo_and_topic'] = [
            {
                'solo_category': row.solo_taxonomy_level,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'answer_count': row.answer_count,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in solo_topic_res if row.answer_count > 0
        ]
        
        # SOLO taxonomy stats by time range (aggregated by category, no dates)
        stats['questions_by_solo_over_time'] = {
            'all_time': (
                # Global (all topics)
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'question_count': row.question_count
                } for row in ts_solo_questions_res_all] +
                # Per-topic breakdown
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'question_count': row.question_count
                } for row in ts_solo_questions_topic_res_all]
            ),
            'past_3_days': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'question_count': row.question_count
                } for row in ts_solo_questions_res_3d] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'question_count': row.question_count
                } for row in ts_solo_questions_topic_res_3d]
            ),
            'past_week': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'question_count': row.question_count
                } for row in ts_solo_questions_res_7d] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'question_count': row.question_count
                } for row in ts_solo_questions_topic_res_7d]
            )
        }
        
        stats['accuracy_by_solo_over_time'] = {
            'all_time': (
                # Global (all topics)
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_res_all if row.answer_count > 0] +
                # Per-topic breakdown
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_topic_res_all if row.answer_count > 0]
            ),
            'past_3_days': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_res_3d if row.answer_count > 0] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_topic_res_3d if row.answer_count > 0]
            ),
            'past_week': (
                # Global
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': None,
                    'topic_name': None,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_res_7d if row.answer_count > 0] +
                # Per-topic
                [{
                    'solo_category': row.solo_taxonomy_level,
                    'topic_id': row.topic_id,
                    'topic_name': row.topic_name,
                    'avg_accuracy': safe_float(row.avg_accuracy)
                } for row in ts_solo_accuracy_topic_res_7d if row.answer_count > 0]
            )
        }

        stats['interactions_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'interaction_count': safe_float(row.avg_interaction_count)
            } for row in ts_interaction_res
        ]
        
        stats['duration_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_duration': timedelta_to_minutes(row.avg_duration)
            } for row in ts_duration_res
        ]

        # New time series data for grades and accuracy
        stats['grades_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_grade_points': safe_float(row.avg_grade_points)
            } for row in ts_grades_res
        ]
        
        stats['accuracy_over_time_by_topic'] = [
            {
                'date': row.date.isoformat() if row.date else None,
                'topic_id': row.topic_id,
                'topic_name': row.topic_name,
                'avg_accuracy': safe_float(row.avg_accuracy)
            } for row in ts_accuracy_res
        ]

        try:
            compressed_data = gzip.compress(json.dumps(stats).encode('utf-8'))
            red_client.setex(CACHE_KEY, 600, compressed_data)
        except Exception as e:
            print(f"[WARN] Failed to cache user stats: {e}")

        return stats

    finally:
        session.close()

def create_indexes_if_needed():
    """
    Creates database indexes using SQLAlchemy Core objects.
    Updated for new schema column names.
    """
    print("\n--- Ensuring Database Indexes Exist (SQLAlchemy Core) ---")
    
    indexes_to_create = [
        Index("idx_conversation_user_id", Conversation.user_id),
        Index("idx_message_conversation_id", Message.conversation_id),
        Index("idx_question_message_id", Question.message_id),
        Index("idx_answer_question_id", Answer.question_id),
        Index("idx_question_solo_taxonomy", Question.solo_taxonomy_level), 
        Index("idx_message_timestamp", Message.timestamp),
        Index("idx_question_topics_qt", question_topics.c.question_id, question_topics.c.topic_id),
        Index("idx_question_topics_tq", question_topics.c.topic_id, question_topics.c.question_id),
        Index("idx_question_created_at", Question.created_at),
    ]

    for index in indexes_to_create:
        try:
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
    session = get_db_session()
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
    target_user_id = 2
    print(f"\n=== Testing Individual Statistics (User {target_user_id}) ===")
    individual_start = time.perf_counter()
    individual_stats = individual_statistics(target_user_id)
    individual_end = time.perf_counter()
    print(f"Individual statistics: {(individual_end - individual_start)*1000:.2f}ms")
    print(f"User {target_user_id} Average Question Grade: {individual_stats['average_question_grade']:.2f}" if individual_stats['average_question_grade'] else "No data")
    print(f"User {target_user_id} Average Answer Accuracy: {individual_stats['average_answer_accuracy']:.2f}%" if individual_stats['average_answer_accuracy'] else "No data")
    print(f"User {target_user_id} Conversation Count: {individual_stats['conversation_count']}")
    
    # Verification Query (ORM)
    print(f"\nUser {target_user_id} Questions by Solo Category:")
    session = get_db_session()
    try:
        q_verify_stmt = (
            select(
                Question.id.label("question_id"),
                Question.solo_taxonomy_level,
                Question.grade
            )
            .join(Message, Question.message_id == Message.id)
            .join(Conversation, Message.conversation_id == Conversation.id)
            .where(Conversation.user_id == target_user_id)
            .order_by(Question.solo_taxonomy_level)
        )
        question_query = session.execute(q_verify_stmt).fetchall()
        for row in question_query:
            print(f" Question ID: {row.question_id}, Category: {row.solo_taxonomy_level}, Grade: {row.grade}")
    finally:
        session.close()
    
    total_time = time.perf_counter() - start_time
    print(f"\n{'='*50}")
    print(f"TOTAL EXECUTION TIME: {total_time*1000:.2f}ms")
    print(f"{'='*50}")