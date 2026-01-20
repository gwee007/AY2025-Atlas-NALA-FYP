# Cache Invalidation Implementation - Session-Based Tracking

## Overview
Implemented user-specific cache invalidation that triggers when a user leaves the chatbot area after asking new questions.

## How It Works

### Backend Changes

1. **Redis Helper Function** (`dashboard-backend/redis_client.py`)
   - Added `invalidate_user_cache(user_id)` function
   - Deletes user-specific cache keys:
     - `dashboard:individual_stats:user_{user_id}`
     - `dashboard:summary:user_{user_id}`

2. **New API Endpoint** (`dashboard-backend/api_server.py`)
   - **Route:** `POST /api/cache/invalidate/<user_id>`
   - **Response:** Returns count of deleted cache keys
   - **Error Handling:** Gracefully handles errors and returns status

### Frontend Changes

1. **API Configuration** (`chatbot-frontend/src/config/api.js`)
   - Added `invalidateCache(userId)` endpoint function

2. **Chatbot Hook** (`chatbot-frontend/src/hooks/useChatbotConversations.js`)
   - **On Mount:** Sets `sessionStorage` flag marking user entered chatbot
   - **On Question Send:** Sets flag when new question is graded/created
   - **On Unmount:** Checks flags and calls invalidation endpoint if needed
   - **Cleanup:** Removes all session flags after unmount

## User Flow

```
1. User navigates to chatbot
   → Sets: sessionStorage.chatbot_active_{userId} = 'true'

2. User asks a question
   → Backend evaluates and grades question
   → Sets: sessionStorage.chatbot_new_questions_{userId} = 'true'

3. User navigates away from chatbot
   → Cleanup effect runs
   → Checks if both flags are set
   → Calls: POST /api/cache/invalidate/{userId}
   → Clears session flags

4. User returns to dashboard
   → Fresh data is fetched (cache was cleared)
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
