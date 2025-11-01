import { 
  initRedis, 
  getDashboardStats,
  getStudentVsAverageComparison,
  precomputeCourseStats,
  closeRedis
} from './redis-cache';

/**
 * Example: How to use Redis caching for dashboard statistics
 */
async function exampleDashboardUsage() {
  try {
    // 1. Initialize Redis connection
    console.log('🚀 Initializing Redis...\n');
    await initRedis();
    
    // 2. Precompute stats for a course (run this periodically)
    console.log('⚙️  Precomputing course statistics...\n');
    const courseId = 1;
    await precomputeCourseStats(courseId);
    
    // 3. Get complete dashboard stats (uses cache)
    console.log('📊 Fetching dashboard stats...\n');
    const dashboardStats = await getDashboardStats(courseId);
    console.log('Dashboard Stats:', JSON.stringify(dashboardStats, null, 2));
    
    // 4. Get individual student vs average comparison
    console.log('\n👤 Comparing student to course average...\n');
    const userId = 1;
    const comparison = await getStudentVsAverageComparison(userId, courseId);
    console.log('Student Comparison:', {
      studentScore: comparison.studentScore,
      courseAverage: comparison.courseAverage,
      percentile: `${comparison.percentile}%`,
      difference: comparison.difference,
      performance: comparison.aboveAverage ? '✅ Above Average' : '❌ Below Average'
    });
    
    // 5. Get complete dashboard with user data
    console.log('\n📈 Fetching complete dashboard with user data...\n');
    const completeDashboard = await getDashboardStats(courseId, userId);
    console.log('Complete Dashboard:', JSON.stringify(completeDashboard, null, 2));
    
    console.log('\n✅ Example completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Clean up
    await closeRedis();
  }
}

// Run the example
if (require.main === module) {
  exampleDashboardUsage();
}

export default exampleDashboardUsage;
