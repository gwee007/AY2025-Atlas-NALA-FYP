import express from 'express';
import { 
  initRedis, 
  getDashboardStats, 
  getStudentVsAverageComparison,
  precomputeCourseStats,
  invalidateCourseCaches,
  getTopStudents,
  getStudentRank
} from './redis-cache';

const router = express.Router();

/**
 * Initialize Redis when server starts
 */
export async function initializeDashboardAPI() {
  await initRedis();
  console.log('✅ Dashboard API initialized with Redis caching');
}

/**
 * GET /api/dashboard/course/:courseId
 * Get complete dashboard stats for a course
 */
router.get('/course/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    
    const stats = await getDashboardStats(courseId, userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

/**
 * GET /api/dashboard/comparison/:userId/:courseId
 * Compare individual student vs course average
 */
router.get('/comparison/:userId/:courseId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const courseId = parseInt(req.params.courseId);
    
    const comparison = await getStudentVsAverageComparison(userId, courseId);
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparison data'
    });
  }
});

/**
 * GET /api/dashboard/leaderboard/:courseId
 * Get course leaderboard
 */
router.get('/leaderboard/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const topStudents = await getTopStudents(courseId, limit);
    
    res.json({
      success: true,
      data: topStudents
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

/**
 * GET /api/dashboard/rank/:userId/:courseId
 * Get student's rank in course
 */
router.get('/rank/:userId/:courseId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const courseId = parseInt(req.params.courseId);
    
    const rankInfo = await getStudentRank(courseId, userId);
    
    res.json({
      success: true,
      data: rankInfo
    });
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rank information'
    });
  }
});

/**
 * POST /api/dashboard/refresh/:courseId
 * Force refresh all cache for a course
 */
router.post('/refresh/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    // Invalidate old caches
    await invalidateCourseCaches(courseId);
    
    // Precompute new stats
    await precomputeCourseStats(courseId);
    
    res.json({
      success: true,
      message: `Cache refreshed for course ${courseId}`
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache'
    });
  }
});

export default router;
