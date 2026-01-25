import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dashboard_backend.redis_client import get_redis_client

r = get_redis_client()

# This deletes EVERY key in the current database
r.flushdb()

print("✅ Redis Cache completely flushed. All keys deleted.")