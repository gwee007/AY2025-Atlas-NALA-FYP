"""
Test script for user-specific cache invalidation.
Run this to verify the cache invalidation functionality works correctly.
"""
from .redis_client import get_redis_client, invalidate_user_cache

def test_cache_invalidation():
    """Test the user cache invalidation functionality."""
    redis_client = get_redis_client()
    test_user_id = 2
    
    # Step 1: Set some test cache keys for user 2
    print(f"Setting up test cache keys for user {test_user_id}...")
    redis_client.setex(f"dashboard:individual_stats:user_{test_user_id}", 300, "test_data_1")
    redis_client.setex(f"dashboard:summary:user_{test_user_id}", 300, "test_data_2")
    
    # Verify keys exist
    keys_before = []
    for key in [f"dashboard:individual_stats:user_{test_user_id}", f"dashboard:summary:user_{test_user_id}"]:
        if redis_client.exists(key):
            keys_before.append(key)
    
    print(f"✅ Created {len(keys_before)} cache keys: {keys_before}")
    
    # Step 2: Invalidate cache for user 1
    print(f"\nInvalidating cache for user {test_user_id}...")
    deleted_count = invalidate_user_cache(test_user_id)
    print(f"✅ Deleted {deleted_count} cache keys")
    
    # Step 3: Verify keys are gone
    keys_after = []
    for key in [f"dashboard:individual_stats:user_{test_user_id}", f"dashboard:summary:user_{test_user_id}"]:
        if redis_client.exists(key):
            keys_after.append(key)
    
    if len(keys_after) == 0:
        print(f"✅ SUCCESS: All cache keys for user {test_user_id} were deleted")
    else:
        print(f"❌ FAILED: {len(keys_after)} keys still exist: {keys_after}")
    
    # Step 4: Test with non-existent user (should not error)
    print(f"\nTesting with non-existent user (user_id=999)...")
    deleted_count = invalidate_user_cache(999)
    print(f"✅ Handled gracefully: {deleted_count} keys deleted (expected 0)")
    
    print("\n" + "="*50)
    print("Cache invalidation test completed!")
    print("="*50)

if __name__ == "__main__":
    test_cache_invalidation()
