import os
import redis
from dotenv import load_dotenv

# Helper to load redis client 

load_dotenv()

redis_url = os.getenv("REDIS_ENDPOINT", "redis://localhost:6379/0")
redis_pool = redis.ConnectionPool.from_url(redis_url, decode_responses=True)
redis_client = redis.Redis(connection_pool=redis_pool)

def get_redis_client():
    return redis_client

def invalidate_user_cache(user_id: int):
    """Invalidate all cache keys related to a specific user."""
    try:
        # Pattern to match all user-specific cache keys
        patterns = [
            f"dashboard:individual_stats:user_{user_id}",
            f"dashboard:summary:user_{user_id}"
        ]
        
        deleted_count = 0
        for pattern in patterns:
            if redis_client.exists(pattern):
                redis_client.delete(pattern)
                deleted_count += 1
        
        return deleted_count
    except Exception as e:
        print(f"[ERROR] Failed to invalidate cache for user {user_id}: {e}")
        return 0