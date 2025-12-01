"""
Dashboard metrics and analytics functions.
Provides aggregated statistics for student performance and engagement.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from database import get_db_session
from models import (
    User, Course, Chatbot, Conversation, Message,
    Question, Answer, Topic, GradingData, InteractionData
)


def get_course_overview(course_id: int) -> Dict[str, Any]:
    """Get overall course statistics"""
    db = get_db_session()
    try:
        # Count students, conversations, messages
        chatbot_ids = db.query(Chatbot.chatbot_id).filter(
            Chatbot.course_id == course_id
        ).all()
        chatbot_ids = [cid[0] for cid in chatbot_ids]
        
        total_conversations = db.query(func.count(Conversation.conversation_id)).filter(
            Conversation.chatbot_id.in_(chatbot_ids)
        ).scalar() or 0
        
        total_messages = db.query(func.count(Message.message_id)).join(
            Conversation
        ).filter(
            Conversation.chatbot_id.in_(chatbot_ids)
        ).scalar() or 0
        
        total_students = db.query(func.count(func.distinct(Conversation.created_by_id))).filter(
            Conversation.chatbot_id.in_(chatbot_ids)
        ).scalar() or 0
        
        return {
            'courseId': course_id,
            'totalStudents': total_students,
            'totalConversations': total_conversations,
            'totalMessages': total_messages,
            'averageMessagesPerConversation': round(total_messages / total_conversations, 2) if total_conversations > 0 else 0
        }
    finally:
        db.close()


def get_student_performance(user_id: int, course_id: Optional[int] = None) -> Dict[str, Any]:
    """Get individual student performance metrics"""
    db = get_db_session()
    try:
        # Build query for student's questions and answers
        questions_query = db.query(Question).join(Message).join(Conversation).filter(
            Conversation.created_by_id == user_id
        )
        
        if course_id:
            chatbot_ids = db.query(Chatbot.chatbot_id).filter(
                Chatbot.course_id == course_id
            ).all()
            chatbot_ids = [cid[0] for cid in chatbot_ids]
            questions_query = questions_query.filter(
                Conversation.chatbot_id.in_(chatbot_ids)
            )
        
        total_questions = questions_query.count()
        
        # Count questions by grade
        grades = questions_query.with_entities(
            Question.grade,
            func.count(Question.question_id)
        ).group_by(Question.grade).all()
        
        grade_distribution = {grade: count for grade, count in grades if grade}
        
        # Get answer accuracy distribution
        answers_query = db.query(Answer).join(Question).join(Message).join(Conversation).filter(
            Conversation.created_by_id == user_id
        )
        
        if course_id:
            answers_query = answers_query.filter(
                Conversation.chatbot_id.in_(chatbot_ids)
            )
        
        accuracy_distribution = answers_query.with_entities(
            Answer.accuracy,
            func.count(Answer.answer_id)
        ).group_by(Answer.accuracy).all()
        
        accuracy_dist = {acc: count for acc, count in accuracy_distribution if acc}
        
        return {
            'userId': user_id,
            'courseId': course_id,
            'totalQuestions': total_questions,
            'gradeDistribution': grade_distribution,
            'accuracyDistribution': accuracy_dist
        }
    finally:
        db.close()


def get_topic_performance(course_id: int, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get performance breakdown by topic"""
    db = get_db_session()
    try:
        # Get chatbot IDs for the course
        chatbot_ids = db.query(Chatbot.chatbot_id).filter(
            Chatbot.course_id == course_id
        ).all()
        chatbot_ids = [cid[0] for cid in chatbot_ids]
        
        # Build query for topic statistics
        query = db.query(
            Topic.topic_id,
            Topic.name,
            func.count(Question.question_id).label('question_count'),
            func.count(Answer.answer_id).label('answer_count')
        ).join(
            Question, Topic.topic_id == Question.topic_id
        ).join(
            Message, Question.message_id == Message.message_id
        ).join(
            Conversation, Message.conversation_id == Conversation.conversation_id
        ).outerjoin(
            Answer, Question.question_id == Answer.question_id
        ).filter(
            Conversation.chatbot_id.in_(chatbot_ids)
        )
        
        if user_id:
            query = query.filter(Conversation.created_by_id == user_id)
        
        query = query.group_by(Topic.topic_id, Topic.name)
        
        results = query.all()
        
        return [
            {
                'topicId': topic_id,
                'topicName': name,
                'questionCount': q_count,
                'answerCount': a_count
            }
            for topic_id, name, q_count, a_count in results
        ]
    finally:
        db.close()


def get_engagement_metrics(course_id: int, days: int = 30) -> Dict[str, Any]:
    """Get student engagement metrics for the past N days"""
    db = get_db_session()
    try:
        since_date = datetime.now() - timedelta(days=days)
        
        # Get chatbot IDs for course
        chatbot_ids = db.query(Chatbot.chatbot_id).filter(
            Chatbot.course_id == course_id
        ).all()
        chatbot_ids = [cid[0] for cid in chatbot_ids]
        
        # Active students (had conversations in the period)
        active_students = db.query(
            func.count(func.distinct(Conversation.created_by_id))
        ).filter(
            and_(
                Conversation.chatbot_id.in_(chatbot_ids),
                Conversation.last_accessed >= since_date
            )
        ).scalar() or 0
        
        # New conversations
        new_conversations = db.query(func.count(Conversation.conversation_id)).filter(
            and_(
                Conversation.chatbot_id.in_(chatbot_ids),
                Conversation.last_accessed >= since_date
            )
        ).scalar() or 0
        
        # Messages sent
        messages_sent = db.query(func.count(Message.message_id)).join(
            Conversation
        ).filter(
            and_(
                Conversation.chatbot_id.in_(chatbot_ids),
                Message.timestamp >= since_date
            )
        ).scalar() or 0
        
        # Average interaction time from InteractionData table
        avg_interaction = db.query(
            func.avg(InteractionData.DurationSeconds)
        ).filter(
            InteractionData.StartTime >= since_date
        ).scalar() or 0
        
        return {
            'period': f'Last {days} days',
            'activeStudents': active_students,
            'newConversations': new_conversations,
            'messagesSent': messages_sent,
            'averageInteractionTime': round(float(avg_interaction), 2) if avg_interaction else 0
        }
    finally:
        db.close()


def get_taxonomy_distribution(course_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Get distribution of questions/answers across Bloom's and SOLO taxonomy levels"""
    db = get_db_session()
    try:
        # Get chatbot IDs
        chatbot_ids = db.query(Chatbot.chatbot_id).filter(
            Chatbot.course_id == course_id
        ).all()
        chatbot_ids = [cid[0] for cid in chatbot_ids]
        
        # SOLO taxonomy distribution from questions
        solo_query = db.query(
            Question.solo_taxonomy_label,
            func.count(Question.question_id)
        ).join(Message).join(Conversation).filter(
            Conversation.chatbot_id.in_(chatbot_ids)
        )
        
        if user_id:
            solo_query = solo_query.filter(Conversation.created_by_id == user_id)
        
        solo_dist = solo_query.group_by(Question.solo_taxonomy_label).all()
        solo_distribution = {label: count for label, count in solo_dist if label}
        
        # Bloom's taxonomy distribution from answers
        bloom_query = db.query(
            Answer.bloom_taxonomy_label,
            func.count(Answer.answer_id)
        ).join(Question).join(Message).join(Conversation).filter(
            Conversation.chatbot_id.in_(chatbot_ids)
        )
        
        if user_id:
            bloom_query = bloom_query.filter(Conversation.created_by_id == user_id)
        
        bloom_dist = bloom_query.group_by(Answer.bloom_taxonomy_label).all()
        bloom_distribution = {label: count for label, count in bloom_dist if label}
        
        return {
            'soloTaxonomy': solo_distribution,
            'bloomTaxonomy': bloom_distribution
        }
    finally:
        db.close()


def get_grading_summary(course_id: Optional[int] = None) -> Dict[str, Any]:
    """Get summary statistics from grading data"""
    db = get_db_session()
    try:
        query = db.query(
            func.count(GradingData.id).label('total_activities'),
            func.avg(GradingData.PointsAchieved).label('avg_points'),
            func.avg(GradingData.TotalPointsPossible).label('avg_possible'),
            func.avg(GradingData.AnswerQualityScore).label('avg_quality'),
            func.sum(func.cast(GradingData.IsQuestionCorrect, Integer)).label('correct_count')
        )
        
        result = query.first()
        
        total = result.total_activities or 0
        avg_points = float(result.avg_points) if result.avg_points else 0
        avg_possible = float(result.avg_possible) if result.avg_possible else 0
        avg_quality = float(result.avg_quality) if result.avg_quality else 0
        correct_count = result.correct_count or 0
        
        return {
            'totalActivities': total,
            'averagePointsAchieved': round(avg_points, 2),
            'averagePointsPossible': round(avg_possible, 2),
            'averagePercentage': round((avg_points / avg_possible * 100), 2) if avg_possible > 0 else 0,
            'averageQualityScore': round(avg_quality, 2),
            'correctAnswerRate': round((correct_count / total * 100), 2) if total > 0 else 0
        }
    finally:
        db.close()


def get_complete_dashboard(course_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Get all dashboard data in one call"""
    return {
        'overview': get_course_overview(course_id),
        'engagement': get_engagement_metrics(course_id),
        'taxonomyDistribution': get_taxonomy_distribution(course_id, user_id),
        'topicPerformance': get_topic_performance(course_id, user_id),
        'gradingSummary': get_grading_summary(course_id),
        'studentPerformance': get_student_performance(user_id, course_id) if user_id else None,
        'timestamp': datetime.now().isoformat()
    }


if __name__ == "__main__":
    # Test dashboard metrics
    print("Testing dashboard metrics...")
    try:
        from database import init_db
        
        # Example: Get dashboard for course 1
        course_id = 1
        dashboard_data = get_complete_dashboard(course_id)
        
        print("\n📊 Dashboard Data:")
        print(f"Course ID: {course_id}")
        print(f"Total Students: {dashboard_data['overview']['totalStudents']}")
        print(f"Total Conversations: {dashboard_data['overview']['totalConversations']}")
        print(f"Active Students (30 days): {dashboard_data['engagement']['activeStudents']}")
        
        print("\n✅ Dashboard metrics module is ready!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
