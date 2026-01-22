# Cache Invalidation Implementation - Immediate + Session-Based

## Overview
Implemented dual-layer cache invalidation:
1. **Immediate invalidation** when a question is asked (backend-side)
2. **Group cache invalidation** when user leaves chatbot area (frontend-side)

## How It Works

### Backend Changes

1. **Redis Helper Functions** (`dashboard-backend/redis_client.py`)
   - `invalidate_user_cache(user_id)` - Deletes user-specific cache keys
   - `invalidate_group_cache()` - Deletes group statistics cache
   - `invalidate_all_caches(user_id)` - Deletes both user and group caches
   - Cache keys managed:
     - `dashboard:individual_stats:user_{user_id}`
     - `dashboard:summary:user_{user_id}`
     - `dashboard:group_statistics`

2. **Chat Endpoint** (`app/routes.py`)
   - **Immediate invalidation:** When a question is processed and graded, `invalidate_all_caches(user_id)` is called
   - This ensures fresh data is available immediately after a question is asked
   - Logs cache invalidation for debugging

3. **Cache API Endpoint** (`dashboard-backend/api_server.py`)
   - **Route:** `POST /api/cache/invalidate/<user_id>?group=true`
   - **Query param:** `group=true` invalidates both user and group caches
   - **Response:** Returns count of deleted cache keys
   - **Error Handling:** Gracefully handles errors and returns status

### Frontend Changes

1. **API Configuration** (`chatbot-frontend/src/config/api.js`)
   - Added `invalidateCache(userId)` endpoint function

2. **Chatbot Hook** (`chatbot-frontend/src/hooks/useChatbotConversations.js`)
   - **On Mount:** Sets `sessionStorage` flag marking user entered chatbot
   - **On Question Send:** Sets flag when new question is graded/created
   - **On Unmount:** Checks flags and calls invalidation endpoint with `?group=true` if needed
   - **Cleanup:** Removes all session flags after unmount

## User Flow

```
1. User navigates to chatbot
   → Sets: sessionStorage.chatbot_active_{userId} = 'true'

2. User asks a question
   → Backend evaluates and grades question
   → Backend immediately calls: invalidate_all_caches(userId)
   → Invalidates: user cache + group cache
   → Sets: sessionStorage.chatbot_new_questions_{userId} = 'true'

3. User navigates away from chatbot
   → Cleanup effect runs
   → Checks if both flags are set
   → Calls: POST /api/cache/invalidate/{userId}?group=true
   → Ensures group cache is cleared (redundant but safe)
   → Clears session flags

4. User returns to dashboard
   → Fresh data is fetched (cache was cleared immediately after question)
   → New statistics reflect recent questions
```

## Key Features

✅ **User-Specific:** Only invalidates cache for the specific user
✅ **Conditional:** Only triggers if new questions were actually asked
✅ **Non-Blocking:** Cache invalidation happens asynchronously during cleanup
✅ **Resilient:** Works across page refreshes (uses sessionStorage)
✅ **Fail-Safe:** Errors in cache invalidation don't break the UI

## Testing

Run the test script to verify functionality:

```bash
cd chatbot-backend/dashboard-backend
python test_cache_invalidation.py
```

Expected output:
```
Setting up test cache keys for user 1...
✅ Created 2 cache keys: [...]
Invalidating cache for user 1...
✅ Deleted 2 cache keys
✅ SUCCESS: All cache keys for user 1 were deleted
```

## Technical Notes

- **sessionStorage** persists across page refreshes but clears when tab closes
- Cache invalidation is called during component unmount (when leaving page)
- If browser crashes, flags are cleared automatically on next session
- Backend endpoint is idempotent (safe to call multiple times)

## Future Enhancements

If needed, could add:
- Invalidation of group statistics cache
- Webhook-based invalidation on database triggers
- More granular cache key patterns
- Admin endpoint to invalidate all user caches
