import { createClient } from 'redis';
import prisma from './prisma';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis connection
 */
export async function initRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Get Redis client instance
 */
export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initRedis() first.');
  }
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// -------------------------------------------
// CACHE KEY PATTERNS
// -------------------------------------------

const CACHE_KEYS = {
  // Grading averages
  COURSE_AVG_SCORE: (courseId: number) => `course:${courseId}:avg_score`,
  COURSE_AVG_POINTS: (courseId: number) => `course:${courseId}:avg_points`,
  TOPIC_AVG_SCORE: (topicId: number) => `topic:${topicId}:avg_score`,
  
  // User-specific comparisons
  USER_COURSE_SCORE: (userId: number, courseId: number) => `user:${userId}:course:${courseId}:score`,
  USER_TOPIC_SCORE: (userId: number, topicId: number) => `user:${userId}:topic:${topicId}:score`,
  
  // Interaction metrics
  COURSE_AVG_INTERACTION_TIME: (courseId: number) => `course:${courseId}:avg_interaction_time`,
  COURSE_AVG_INTERACTION_COUNT: (courseId: number) => `course:${courseId}:avg_interaction_count`,
  
  // Dashboard aggregates (sorted sets for leaderboards)
  COURSE_LEADERBOARD: (courseId: number) => `leaderboard:course:${courseId}`,
  TOPIC_PERFORMANCE: (topicId: number) => `performance:topic:${topicId}`,
  
  // Time-based stats
  DAILY_STATS: (date: string, courseId: number) => `stats:daily:${date}:course:${courseId}`,
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 300,      // 5 minutes - for frequently changing data
  MEDIUM: 1800,    // 30 minutes - for moderately stable data
  LONG: 3600,      // 1 hour - for stable aggregates
  DAILY: 86400,    // 24 hours - for daily stats
};

// -------------------------------------------
// GRADING AGGREGATE FUNCTIONS
// -------------------------------------------

/**
 * Calculate and cache average points achieved across all students in a course
 */
export async function getCourseAveragePoints(courseId: number, forceRefresh = false): Promise<number> {
  const client = getRedisClient();
  const cacheKey = CACHE_KEYS.COURSE_AVG_POINTS(courseId);
  
  if (!forceRefresh) {
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return parseFloat(cached);
    }
  }
  
  console.log(`🔍 Cache miss: ${cacheKey} - Querying database...`);
  
  // Calculate average from database
  const result = await prisma.gradingData.aggregate({
    _avg: {
      PointsAchieved: true
    },
    where: {
      // You can add course filtering here if you add course_id to GradingData
    }
  });
  
  const avgPoints = result._avg.PointsAchieved?.toNumber() || 0;
  
  // Cache the result
  await client.setEx(cacheKey, CACHE_TTL.MEDIUM, avgPoints.toString());
  
  return avgPoints;
}

/**
 * Calculate and cache average answer quality score per course
 */
export async function getCourseAverageQualityScore(courseId: number, forceRefresh = false): Promise<number> {
  const client = getRedisClient();
  const cacheKey = CACHE_KEYS.COURSE_AVG_SCORE(courseId);
  
  if (!forceRefresh) {
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return parseFloat(cached);
    }
  }
  
  console.log(`🔍 Cache miss: ${cacheKey} - Querying database...`);
  
  const result = await prisma.gradingData.aggregate({
    _avg: {
      AnswerQualityScore: true
    }
  });
  
  const avgScore = result._avg.AnswerQualityScore?.toNumber() || 0;
  await client.setEx(cacheKey, CACHE_TTL.MEDIUM, avgScore.toString());
  
  return avgScore;
}

/**
 * Get individual student's score and compare with course average
 */
export async function getStudentVsAverageComparison(userId: number, courseId: number) {
  const client = getRedisClient();
  
  // Get student's score (with caching)
  const studentCacheKey = CACHE_KEYS.USER_COURSE_SCORE(userId, courseId);
  let studentScore: number;
  
  const cachedStudentScore = await client.get(studentCacheKey);
  if (cachedStudentScore) {
    studentScore = parseFloat(cachedStudentScore);
  } else {
    // Calculate student's average score
    const studentResult = await prisma.gradingData.aggregate({
      _avg: {
        AnswerQualityScore: true
      },
      where: {
        // Add user_id filter when you add it to GradingData model
      }
    });
    
    studentScore = studentResult._avg.AnswerQualityScore?.toNumber() || 0;
    await client.setEx(studentCacheKey, CACHE_TTL.SHORT, studentScore.toString());
  }
  
  // Get course average
  const courseAverage = await getCourseAverageQualityScore(courseId);
  
  return {
    studentScore,
    courseAverage,
    percentile: ((studentScore / courseAverage) * 100).toFixed(2),
    difference: (studentScore - courseAverage).toFixed(2),
    aboveAverage: studentScore > courseAverage
  };
}

// -------------------------------------------
// INTERACTION AGGREGATE FUNCTIONS
// -------------------------------------------

/**
 * Calculate and cache average interaction time for a course
 */
export async function getCourseAverageInteractionTime(courseId: number, forceRefresh = false): Promise<number> {
  const client = getRedisClient();
  const cacheKey = CACHE_KEYS.COURSE_AVG_INTERACTION_TIME(courseId);
  
  if (!forceRefresh) {
    const cached = await client.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return parseFloat(cached);
    }
  }
  
  console.log(`🔍 Cache miss: ${cacheKey} - Querying database...`);
  
  const result = await prisma.interactionData.aggregate({
    _avg: {
      DurationSeconds: true
    }
  });
  
  const avgTime = result._avg.DurationSeconds || 0;
  await client.setEx(cacheKey, CACHE_TTL.MEDIUM, avgTime.toString());
  
  return avgTime;
}

/**
 * Calculate and cache average interaction count per session
 */
export async function getCourseAverageInteractionCount(courseId: number, forceRefresh = false): Promise<number> {
  const client = getRedisClient();
  const cacheKey = CACHE_KEYS.COURSE_AVG_INTERACTION_COUNT(courseId);
  
  if (!forceRefresh) {
    const cached = await client.get(cacheKey);
    if (cached) return parseInt(cached);
  }
  
  const result = await prisma.interactionData.aggregate({
    _avg: {
      InteractionCount: true
    }
  });
  
  const avgCount = result._avg.InteractionCount || 0;
  await client.setEx(cacheKey, CACHE_TTL.MEDIUM, avgCount.toString());
  
  return avgCount;
}

// -------------------------------------------
// LEADERBOARD FUNCTIONS (Sorted Sets)
// -------------------------------------------

/**
 * Update course leaderboard with student scores
 * Uses Redis Sorted Sets for efficient ranking
 */
export async function updateCourseLeaderboard(courseId: number) {
  const client = getRedisClient();
  const leaderboardKey = CACHE_KEYS.COURSE_LEADERBOARD(courseId);
  
  console.log(`🏆 Updating leaderboard for course ${courseId}...`);
  
  // Get all students' scores (you'll need to join with user data)
  // This is a simplified example - adjust based on your schema
  const scores = await prisma.gradingData.groupBy({
    by: ['id'], // Replace with user_id when available
    _avg: {
      AnswerQualityScore: true
    }
  });
  
  // Update sorted set
  for (const score of scores) {
    const avgScore = score._avg.AnswerQualityScore?.toNumber() || 0;
    await client.zAdd(leaderboardKey, {
      score: avgScore,
      value: `student:${score.id}` // Replace with actual user_id
    });
  }
  
  // Set expiration
  await client.expire(leaderboardKey, CACHE_TTL.LONG);
  
  console.log(`✅ Leaderboard updated with ${scores.length} entries`);
}

/**
 * Get top N students from leaderboard
 */
export async function getTopStudents(courseId: number, limit = 10) {
  const client = getRedisClient();
  const leaderboardKey = CACHE_KEYS.COURSE_LEADERBOARD(courseId);
  
  // Get top scorers (descending order)
  const topStudents = await client.zRangeWithScores(leaderboardKey, 0, limit - 1, {
    REV: true // Reverse order for highest scores first
  });
  
  return topStudents.map((entry, index) => ({
    rank: index + 1,
    studentId: entry.value,
    score: entry.score
  }));
}

/**
 * Get student's rank in course
 */
export async function getStudentRank(courseId: number, studentId: number) {
  const client = getRedisClient();
  const leaderboardKey = CACHE_KEYS.COURSE_LEADERBOARD(courseId);
  
  const rank = await client.zRevRank(leaderboardKey, `student:${studentId}`);
  const score = await client.zScore(leaderboardKey, `student:${studentId}`);
  
  return {
    rank: rank !== null ? rank + 1 : null, // Convert to 1-based ranking
    score: score || 0
  };
}

// -------------------------------------------
// CACHE INVALIDATION
// -------------------------------------------

/**
 * Invalidate all caches related to a course
 */
export async function invalidateCourseCaches(courseId: number) {
  const client = getRedisClient();
  
  const keysToDelete = [
    CACHE_KEYS.COURSE_AVG_SCORE(courseId),
    CACHE_KEYS.COURSE_AVG_POINTS(courseId),
    CACHE_KEYS.COURSE_AVG_INTERACTION_TIME(courseId),
    CACHE_KEYS.COURSE_AVG_INTERACTION_COUNT(courseId),
    CACHE_KEYS.COURSE_LEADERBOARD(courseId),
  ];
  
  await client.del(keysToDelete);
  console.log(`🗑️  Invalidated ${keysToDelete.length} cache keys for course ${courseId}`);
}

/**
 * Invalidate user-specific caches
 */
export async function invalidateUserCaches(userId: number) {
  const client = getRedisClient();
  
  // Find all keys matching pattern user:{userId}:*
  const keys = await client.keys(`user:${userId}:*`);
  
  if (keys.length > 0) {
    await client.del(keys);
    console.log(`🗑️  Invalidated ${keys.length} cache keys for user ${userId}`);
  }
}

/**
 * Clear all caches (use with caution!)
 */
export async function clearAllCaches() {
  const client = getRedisClient();
  await client.flushDb();
  console.log('🗑️  All caches cleared');
}

// -------------------------------------------
// BULK OPERATIONS
// -------------------------------------------

/**
 * Precompute and cache all course statistics
 * Run this periodically (e.g., every hour via cron job)
 */
export async function precomputeCourseStats(courseId: number) {
  console.log(`⚙️  Precomputing stats for course ${courseId}...`);
  
  await Promise.all([
    getCourseAveragePoints(courseId, true),
    getCourseAverageQualityScore(courseId, true),
    getCourseAverageInteractionTime(courseId, true),
    getCourseAverageInteractionCount(courseId, true),
    updateCourseLeaderboard(courseId),
  ]);
  
  console.log(`✅ Stats precomputed for course ${courseId}`);
}

/**
 * Export for dashboard API
 */
export async function getDashboardStats(courseId: number, userId?: number) {
  const courseStats = {
    averagePoints: await getCourseAveragePoints(courseId),
    averageQualityScore: await getCourseAverageQualityScore(courseId),
    averageInteractionTime: await getCourseAverageInteractionTime(courseId),
    averageInteractionCount: await getCourseAverageInteractionCount(courseId),
    topStudents: await getTopStudents(courseId, 10),
  };
  
  let userComparison;
  if (userId) {
    userComparison = await getStudentVsAverageComparison(userId, courseId);
  }
  
  return {
    course: courseStats,
    user: userComparison,
    timestamp: new Date().toISOString(),
  };
}
