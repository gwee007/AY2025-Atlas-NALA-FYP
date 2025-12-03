"""
Redis caching layer for dashboard statistics and metrics.
Implements caching strategies for frequently accessed aggregated data.
"""

import os
import json
from typing import Optional, Dict, Any, List
from redis import Redis
from dotenv import load_dotenv
from sqlalchemy import func
from database import get_db_session
from models import (
    GradingData, InteractionData, User, Course, 
    Chatbot, Conversation, Message, Question, Answer
)

# Load environment variables
load_dotenv()

# Redis client singleton
_redis_client: Optional[Redis] = None


def get_redis_client() -> Redis:
    """Get or create Redis client instance"""
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379')
        _redis_client = Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_keepalive=True
        )
    
    return _redis_client


def init_redis():
    """Initialize and test Redis connection"""
    try:
        client = get_redis_client()
        client.ping()
        print("✅ Redis connected successfully!")
        return client
    except Exception as e:
        print(f"❌ Redis connection failed: {e}")
        raise


def close_redis():
    """Close Redis connection"""
    global _redis_client
    if _redis_client:
        _redis_client.close()
        _redis_client = None


# Cache key patterns
class CacheKeys:
    COURSE_AVG_SCORE = "course:{course_id}:avg_score"
    COURSE_AVG_POINTS = "course:{course_id}:avg_points"
    USER_COURSE_SCORE = "user:{user_id}:course:{course_id}:score"
    COURSE_AVG_INTERACTION_TIME = "course:{course_id}:avg_interaction_time"
    COURSE_AVG_INTERACTION_COUNT = "course:{course_id}:avg_interaction_count"
    COURSE_LEADERBOARD = "leaderboard:course:{course_id}"
    COURSE_STATS = "stats:course:{course_id}"


# Cache TTL (Time To Live) in seconds
class CacheTTL:
    SHORT = 300      # 5 minutes
    MEDIUM = 1800    # 30 minutes
    LONG = 3600      # 1 hour
    DAILY = 86400    # 24 hours


def get_cached(key: str) -> Optional[str]:
    """Get value from cache"""
    try:
        client = get_redis_client()
        return client.get(key)
    except Exception as e:
        print(f"Cache read error: {e}")
        return None


def set_cached(key: str, value: Any, ttl: int = CacheTTL.MEDIUM):
    """Set value in cache with TTL"""
    try:
        client = get_redis_client()
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        client.setex(key, ttl, str(value))
    except Exception as e:
        print(f"Cache write error: {e}")


def invalidate_cache(pattern: str):
    """Invalidate cache keys matching pattern"""
    try:
        client = get_redis_client()
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
            print(f"🗑️ Invalidated {len(keys)} cache keys")
    except Exception as e:
        print(f"Cache invalidation error: {e}")


# Dashboard statistics functions

def get_course_average_points(course_id: int, force_refresh: bool = False) -> float:
    """Calculate and cache average points achieved in a course"""
    cache_key = CacheKeys.COURSE_AVG_POINTS.format(course_id=course_id)
    
    if not force_refresh:
        cached = get_cached(cache_key)
        if cached:
            print(f"📦 Cache hit: {cache_key}")
            return float(cached)
    
    print(f"🔍 Cache miss: {cache_key} - Querying database...")
    db = get_db_session()
    try:
        result = db.query(func.avg(GradingData.PointsAchieved)).scalar()
        avg_points = float(result) if result else 0.0
        set_cached(cache_key, avg_points, CacheTTL.MEDIUM)
        return avg_points
    finally:
        db.close()


def get_course_average_quality_score(course_id: int, force_refresh: bool = False) -> float:
    """Calculate and cache average answer quality score for a course"""
    cache_key = CacheKeys.COURSE_AVG_SCORE.format(course_id=course_id)
    
    if not force_refresh:
        cached = get_cached(cache_key)
        if cached:
            print(f"📦 Cache hit: {cache_key}")
            return float(cached)
    
    print(f"🔍 Cache miss: {cache_key} - Querying database...")
    db = get_db_session()
    try:
        result = db.query(func.avg(GradingData.AnswerQualityScore)).scalar()
        avg_score = float(result) if result else 0.0
        set_cached(cache_key, avg_score, CacheTTL.MEDIUM)
        return avg_score
    finally:
        db.close()


def get_course_average_interaction_time(course_id: int, force_refresh: bool = False) -> int:
    """Calculate and cache average interaction time for a course"""
    cache_key = CacheKeys.COURSE_AVG_INTERACTION_TIME.format(course_id=course_id)
    
    if not force_refresh:
        cached = get_cached(cache_key)
        if cached:
            print(f"📦 Cache hit: {cache_key}")
            return int(float(cached))
    
    print(f"🔍 Cache miss: {cache_key} - Querying database...")
    db = get_db_session()
    try:
        result = db.query(func.avg(InteractionData.DurationSeconds)).scalar()
        avg_time = int(result) if result else 0
        set_cached(cache_key, avg_time, CacheTTL.MEDIUM)
        return avg_time
    finally:
        db.close()


def get_student_vs_average_comparison(user_id: int, course_id: int) -> Dict[str, Any]:
    """Compare individual student's score with course average"""
    cache_key = CacheKeys.USER_COURSE_SCORE.format(user_id=user_id, course_id=course_id)
    
    # Get student score (implement based on your logic)
    cached_student_score = get_cached(cache_key)
    if cached_student_score:
        student_score = float(cached_student_score)
    else:
        # Calculate student's average score from grading data
        db = get_db_session()
        try:
            # This is a placeholder - adjust based on how you link users to grading data
            result = db.query(func.avg(GradingData.AnswerQualityScore)).scalar()
            student_score = float(result) if result else 0.0
            set_cached(cache_key, student_score, CacheTTL.SHORT)
        finally:
            db.close()
    
    # Get course average
    course_average = get_course_average_quality_score(course_id)
    
    return {
        'studentScore': student_score,
        'courseAverage': course_average,
        'percentile': round((student_score / course_average * 100), 2) if course_average > 0 else 0,
        'difference': round(student_score - course_average, 2),
        'aboveAverage': student_score > course_average
    }


def update_course_leaderboard(course_id: int):
    """Update course leaderboard using Redis sorted sets"""
    leaderboard_key = CacheKeys.COURSE_LEADERBOARD.format(course_id=course_id)
    
    print(f"🏆 Updating leaderboard for course {course_id}...")
    db = get_db_session()
    client = get_redis_client()
    
    try:
        # Get all students' scores (adjust query based on your schema)
        # This is a placeholder - you'll need to join properly with user data
        results = db.query(
            GradingData.id,
            func.avg(GradingData.AnswerQualityScore).label('avg_score')
        ).group_by(GradingData.id).all()
        
        # Update sorted set
        for result in results:
            client.zadd(leaderboard_key, {f"student:{result.id}": float(result.avg_score)})
        
        # Set expiration
        client.expire(leaderboard_key, CacheTTL.LONG)
        print(f"✅ Leaderboard updated with {len(results)} entries")
    finally:
        db.close()


def get_top_students(course_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    """Get top N students from leaderboard"""
    leaderboard_key = CacheKeys.COURSE_LEADERBOARD.format(course_id=course_id)
    client = get_redis_client()
    
    top_students = client.zrevrange(leaderboard_key, 0, limit - 1, withscores=True)
    
    return [
        {
            'rank': index + 1,
            'studentId': student_id.decode() if isinstance(student_id, bytes) else student_id,
            'score': score
        }
        for index, (student_id, score) in enumerate(top_students)
    ]


def get_student_rank(course_id: int, user_id: int) -> Dict[str, Any]:
    """Get student's rank in course leaderboard"""
    leaderboard_key = CacheKeys.COURSE_LEADERBOARD.format(course_id=course_id)
    client = get_redis_client()
    
    student_key = f"student:{user_id}"
    rank = client.zrevrank(leaderboard_key, student_key)
    score = client.zscore(leaderboard_key, student_key)
    
    return {
        'rank': rank + 1 if rank is not None else None,
        'score': score if score else 0.0
    }


def precompute_course_stats(course_id: int):
    """Precompute and cache all statistics for a course"""
    print(f"⚙️ Precomputing stats for course {course_id}...")
    
    get_course_average_points(course_id, force_refresh=True)
    get_course_average_quality_score(course_id, force_refresh=True)
    get_course_average_interaction_time(course_id, force_refresh=True)
    update_course_leaderboard(course_id)
    
    print(f"✅ Stats precomputed for course {course_id}")


def get_dashboard_stats(course_id: int, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Get complete dashboard statistics for a course"""
    course_stats = {
        'averagePoints': get_course_average_points(course_id),
        'averageQualityScore': get_course_average_quality_score(course_id),
        'averageInteractionTime': get_course_average_interaction_time(course_id),
        'topStudents': get_top_students(course_id, 10)
    }
    
    user_comparison = None
    if user_id:
        user_comparison = get_student_vs_average_comparison(user_id, course_id)
    
    return {
        'course': course_stats,
        'user': user_comparison,
        'timestamp': str(datetime.now())
    }


def invalidate_course_caches(course_id: int):
    """Invalidate all caches related to a course"""
    patterns = [
        f"course:{course_id}:*",
        f"leaderboard:course:{course_id}",
        f"stats:course:{course_id}"
    ]
    
    for pattern in patterns:
        invalidate_cache(pattern)


if __name__ == "__main__":
    from datetime import datetime
    
    # Test Redis connection
    print("Testing Redis connection...")
    try:
        init_redis()
        
        # Test basic cache operations
        print("\nTesting cache operations...")
        set_cached("test:key", "test_value", 60)
        value = get_cached("test:key")
        print(f"Cached value: {value}")
        
        print("\n✅ Redis cache module is ready!")
    except Exception as e:
        print(f"\n❌ Redis test failed: {e}")
    finally:
        close_redis()
