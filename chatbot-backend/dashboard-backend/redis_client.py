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