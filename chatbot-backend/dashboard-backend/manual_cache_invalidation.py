from .redis_client import get_redis_client

r = get_redis_client()

# This deletes EVERY key in the current database
r.flushdb()

print("✅ Redis Cache completely flushed. All keys deleted.")