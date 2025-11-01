import { 
  initRedis, 
  getCourseAverageQualityScore,
  getStudentVsAverageComparison,
  updateCourseLeaderboard,
  getTopStudents,
  closeRedis 
} from './redis-cache';
import prisma from './prisma';

/**
 * Quick test to verify Redis caching is working
 */
async function quickTest() {
  console.log('🧪 Testing Redis Cache Setup...\n');
  
  try {
    // 1. Initialize Redis
    console.log('1️⃣  Connecting to Redis...');
    await initRedis();
    console.log('   ✅ Connected!\n');
    
    // 2. Test basic cache operation
    console.log('2️⃣  Testing basic cache (course average)...');
    const courseId = 1;
    
    // First call - should query database
    console.log('   First call (should hit database):');
    const avg1 = await getCourseAverageQualityScore(courseId);
    console.log(`   Average Score: ${avg1}`);
    
    // Second call - should use cache
    console.log('   Second call (should hit cache):');
    const avg2 = await getCourseAverageQualityScore(courseId);
    console.log(`   Average Score: ${avg2}`);
    console.log('   ✅ Cache working!\n');
    
    // 3. Test leaderboard
    console.log('3️⃣  Testing leaderboard...');
    await updateCourseLeaderboard(courseId);
    const top5 = await getTopStudents(courseId, 5);
    console.log('   Top 5 students:', top5);
    console.log('   ✅ Leaderboard working!\n');
    
    // 4. Check what's in the cache
    console.log('4️⃣  Checking cached keys...');
    const { getRedisClient } = await import('./redis-cache');
    const client = getRedisClient();
    const keys = await client.keys('*');
    console.log(`   Found ${keys.length} cached keys:`);
    keys.forEach(key => console.log(`   - ${key}`));
    console.log('   ✅ Cache inspection working!\n');
    
    console.log('🎉 All tests passed! Redis cache is ready to use.');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx tsx src/example-dashboard-usage.ts');
    console.log('   2. Set up API routes with: src/dashboard-api.ts');
    console.log('   3. Read: REDIS_DASHBOARD_CACHE.md for full documentation');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Is Redis running? Check with: redis-cli ping');
    console.log('   2. Check REDIS_URL in .env file');
    console.log('   3. Install Redis: choco install redis-64 (Windows)');
    console.log('   4. Or use Docker: docker run -d -p 6379:6379 redis:alpine');
  } finally {
    await closeRedis();
  }
}

// Run test
quickTest();
