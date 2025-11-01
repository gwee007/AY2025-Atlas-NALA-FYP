# Redis Cache Architecture for NALA Dashboard

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Dashboard Component                                          │  │
│  │  - Individual Score Chart                                     │  │
│  │  - Class Average Comparison                                   │  │
│  │  - Leaderboard Display                                        │  │
│  │  - Performance Trends                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP Request
                             │ GET /api/dashboard/course/1?userId=5
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express)                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Dashboard API Routes (dashboard-api.ts)                      │  │
│  │  - GET /course/:courseId                                      │  │
│  │  - GET /comparison/:userId/:courseId                          │  │
│  │  - GET /leaderboard/:courseId                                 │  │
│  │  - POST /refresh/:courseId                                    │  │
│  └──────────────────────────┬───────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  CACHING LAYER (redis-cache.ts)                      │
│                                                                       │
│  ┌─────────────────────┐                                            │
│  │  Cache Check         │                                            │
│  │  ┌───────────────┐  │      ┌──────────────────────────┐         │
│  │  │ Key Exists?    │──YES──▶│ Return Cached Data       │         │
│  │  │ - TTL valid?   │  │      │ (5ms response)          │         │
│  │  └───────┬───────┘  │      └──────────────────────────┘         │
│  │          │ NO        │                                            │
│  └─────────┼───────────┘                                            │
│            │                                                          │
│            ▼                                                          │
│  ┌────────────────────────────────────────────────────┐             │
│  │  Database Query (Prisma)                            │             │
│  │  - Calculate aggregate (500ms)                      │             │
│  │  - Store in cache with TTL                          │             │
│  │  - Return fresh data                                │             │
│  └────────────────────────────────────────────────────┘             │
└─────────────┬──────────────────────────────────┬────────────────────┘
              │                                   │
              ▼                                   ▼
┌──────────────────────────┐      ┌──────────────────────────────────┐
│   REDIS CACHE             │      │   PostgreSQL DATABASE            │
│   (In-Memory)             │      │   (Prisma + Accelerate)          │
│                           │      │                                  │
│  ┌────────────────────┐  │      │  ┌────────────────────────────┐ │
│  │ String Cache        │  │      │  │ Tables:                     │ │
│  │ course:1:avg_score │  │      │  │ - user                      │ │
│  │ = "78.5" (30min)   │  │      │  │ - grading_data             │ │
│  │                    │  │      │  │ - interaction_data          │ │
│  │ user:5:course:1    │  │      │  │ - conversation              │ │
│  │ = "82.3" (5min)    │  │      │  │ - message                   │ │
│  └────────────────────┘  │      │  │ - question                  │ │
│                           │      │  │ - answer                    │ │
│  ┌────────────────────┐  │      │  └────────────────────────────┘ │
│  │ Sorted Sets         │  │      │                                  │
│  │ leaderboard:course:1│  │      │  Aggregation Queries:            │
│  │ 1. Alice (95.2)    │  │      │  ┌────────────────────────────┐ │
│  │ 2. Bob (89.1)      │  │      │  │ SELECT AVG(PointsAchieved) │ │
│  │ 3. Carol (84.3)    │  │      │  │ FROM grading_data          │ │
│  │ ...                │  │      │  │ WHERE course_id = 1        │ │
│  └────────────────────┘  │      │  └────────────────────────────┘ │
└──────────────────────────┘      └──────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Student Views Dashboard (First Time)

```
1. User opens dashboard
   └─▶ Frontend: fetch('/api/dashboard/course/1?userId=5')
   
2. Backend receives request
   └─▶ Calls: getDashboardStats(courseId=1, userId=5)
   
3. Cache Layer checks Redis
   ├─▶ course:1:avg_score → NOT FOUND (cache miss)
   ├─▶ course:1:avg_points → NOT FOUND
   ├─▶ user:5:course:1:score → NOT FOUND
   └─▶ leaderboard:course:1 → NOT FOUND
   
4. Queries PostgreSQL
   ├─▶ SELECT AVG(AnswerQualityScore) FROM grading_data WHERE course_id=1
   │   Result: 78.5 (took 500ms)
   ├─▶ SELECT AVG(PointsAchieved) FROM grading_data WHERE course_id=1
   │   Result: 85.2 (took 450ms)
   └─▶ SELECT AVG(AnswerQualityScore) FROM grading_data WHERE user_id=5
       Result: 82.3 (took 300ms)
   
5. Stores in Redis with TTL
   ├─▶ SET course:1:avg_score "78.5" EX 1800 (30min)
   ├─▶ SET course:1:avg_points "85.2" EX 1800
   └─▶ SET user:5:course:1:score "82.3" EX 300 (5min)
   
6. Returns to frontend
   └─▶ Total time: ~1500ms (database queries + network)
```

### Example 2: Student Views Dashboard (Second Time - Within 5 min)

```
1. User refreshes dashboard
   └─▶ Frontend: fetch('/api/dashboard/course/1?userId=5')
   
2. Backend receives request
   └─▶ Calls: getDashboardStats(courseId=1, userId=5)
   
3. Cache Layer checks Redis
   ├─▶ course:1:avg_score → FOUND ✅ "78.5"
   ├─▶ course:1:avg_points → FOUND ✅ "85.2"
   ├─▶ user:5:course:1:score → FOUND ✅ "82.3"
   └─▶ leaderboard:course:1 → FOUND ✅ [sorted set]
   
4. No database queries needed!
   
5. Returns cached data to frontend
   └─▶ Total time: ~50ms (100x faster! 🚀)
```

## Cache Invalidation Flow

### Scenario: Student Submits New Answer

```
1. Student submits answer
   └─▶ POST /api/answer/submit
   
2. Backend saves to database
   └─▶ INSERT INTO grading_data (user_id, course_id, AnswerQualityScore, ...)
   
3. Trigger cache invalidation
   ├─▶ invalidateCourseCaches(courseId=1)
   │   └─▶ DELETE course:1:avg_score
   │   └─▶ DELETE course:1:avg_points
   │   └─▶ DELETE leaderboard:course:1
   │
   └─▶ invalidateUserCaches(userId=5)
       └─▶ DELETE user:5:course:1:score
       └─▶ DELETE user:5:topic:*
   
4. Next dashboard load
   └─▶ Cache miss → Fresh data from database
   └─▶ New values cached automatically
```

## Cache Key Strategy

### Hierarchical Organization

```
course:{id}:*              → Course-level aggregates
├── course:1:avg_score     → TTL: 30min (MEDIUM)
├── course:1:avg_points    → TTL: 30min
├── course:1:avg_time      → TTL: 30min
└── course:1:avg_interactions → TTL: 30min

user:{id}:*                → User-specific metrics
├── user:5:course:1:score  → TTL: 5min (SHORT, changes frequently)
├── user:5:topic:12:score  → TTL: 5min
└── user:5:rank:course:1   → TTL: 5min

leaderboard:*              → Rankings (Sorted Sets)
├── leaderboard:course:1   → TTL: 1hr (LONG, expensive to compute)
└── performance:topic:12   → TTL: 1hr

stats:daily:*              → Historical data
└── stats:daily:2025-10-31:course:1 → TTL: 24hr (DAILY, immutable)
```

## Performance Impact

### Before Redis (Database Only)

```
User Request → API → PostgreSQL Aggregation → Response

Dashboard Load Times:
- Course average calculation: 500ms
- User score calculation: 300ms
- Leaderboard (100 students): 1200ms
- Total dashboard load: ~2000ms ❌ Slow!

For 100 concurrent users:
- Database load: 200 queries/second
- Risk of connection pool exhaustion
- Slow response times under load
```

### After Redis (Cached)

```
User Request → API → Redis (cache hit) → Response
               └──▶ PostgreSQL (cache miss) → Cache → Response

Dashboard Load Times:
- Course average (cached): 5ms
- User score (cached): 3ms
- Leaderboard (cached): 10ms
- Total dashboard load: ~50ms ✅ 40x faster!

For 100 concurrent users:
- Database load: 2 queries/second (only cache misses)
- Redis handles 99% of reads
- Consistent fast response times
```

## TTL Strategy Rationale

| Cache Type | TTL | Reasoning |
|------------|-----|-----------|
| User scores | 5min | Changes frequently as students submit answers |
| Course averages | 30min | More stable, but should reflect recent activity |
| Leaderboards | 1hr | Expensive to compute, relatively stable rankings |
| Daily stats | 24hr | Historical data, doesn't change once day ends |

## Monitoring & Debugging

### Redis CLI Commands

```bash
# Check if Redis is running
redis-cli ping

# View all cached keys
redis-cli KEYS '*'

# Get a specific value
redis-cli GET "course:1:avg_score"

# Check TTL for a key
redis-cli TTL "course:1:avg_score"

# View leaderboard
redis-cli ZRANGE "leaderboard:course:1" 0 -1 WITHSCORES

# Clear all caches (dangerous!)
redis-cli FLUSHDB
```

### Health Metrics to Monitor

1. **Cache Hit Rate**: Should be >80% for good performance
2. **Memory Usage**: Redis should stay under 100MB for this use case
3. **Key Count**: Monitor growth to detect leaks
4. **Eviction Rate**: Should be low; if high, increase Redis memory

## Next Steps

1. ✅ Install Redis
2. ✅ Install npm packages
3. ⬜ Add user_id/course_id to schema (see SCHEMA_ENHANCEMENT.prisma)
4. ⬜ Run migration
5. ⬜ Test with: `npx tsx src/test-redis.ts`
6. ⬜ Set up API routes
7. ⬜ Connect frontend to API
8. ⬜ Set up periodic cache refresh (cron job)
9. ⬜ Monitor cache performance
