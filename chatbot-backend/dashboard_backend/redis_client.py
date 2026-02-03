import os
import redis
from dotenv import load_dotenv

# Helper to load redis client 

load_dotenv()

redis_url = os.getenv("REDIS_ENDPOINT", "redis://localhost:6379/0")
redis_pool = redis.ConnectionPool.from_url(redis_url, decode_responses=True)
redis_client = redis.Redis(connection_pool=redis_pool)

# Raw client for binary data (gzip compressed)
redis_pool_raw = redis.ConnectionPool.from_url(redis_url, decode_responses=False)
redis_client_raw = redis.Redis(connection_pool=redis_pool_raw)

def get_redis_client():
    return redis_client

def get_redis_client_raw():
    """Get Redis client that returns raw bytes (for gzip-compressed data)"""
    return redis_client_raw

def invalidate_user_cache(user_id: str):
    """Invalidate all cache keys related to a specific user."""
    try:
        # Pattern to match all user-specific cache keys
        patterns = [
            f"dashboard:individual_stats:user:{user_id}",
            f"dashboard:summary_data:{user_id}"
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

def invalidate_group_cache():
    """Invalidate the group statistics cache."""
    try:
        group_key = "dashboard:group_statistics"
        if redis_client.exists(group_key):
            redis_client.delete(group_key)
            print(f"[INFO] Invalidated group cache: {group_key}")
            return 1
        return 0
    except Exception as e:
        print(f"[ERROR] Failed to invalidate group cache: {e}")
        return 0

def invalidate_all_caches(user_id: str):
    """Invalidate both user-specific and group caches when a question is asked."""
    try:
        user_deleted = invalidate_user_cache(user_id)
        group_deleted = invalidate_group_cache()
        total_deleted = user_deleted + group_deleted
        print(f"[INFO] Cache invalidation: {user_deleted} user keys + {group_deleted} group keys = {total_deleted} total")
        return total_deleted
    except Exception as e:
        print(f"[ERROR] Failed to invalidate all caches: {e}")
        return 0