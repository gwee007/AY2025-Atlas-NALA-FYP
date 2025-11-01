// Example usage of Prisma client with Accelerate
import prisma from './prisma';

async function exampleUsage() {
  try {
    // Example 1: Basic query without caching
    console.log('Example 1: Basic query');
    
    // Example 2: Query with caching strategy
    console.log('Example 2: Query with caching (TTL: 60 seconds, SWR: 30 seconds)');
    // Note: This example assumes you have a User model in your schema
    // const users = await prisma.user.findMany({
    //   cacheStrategy: {
    //     ttl: 60,      // Cache for 60 seconds
    //     swr: 30,      // Serve stale data for additional 30 seconds while refreshing
    //     tags: ['users'] // Tags for cache invalidation
    //   }
    // });
    
    // Example 3: Get cache info
    console.log('Example 3: Get cache information');
    // const usersWithInfo = await prisma.user.findMany({
    //   cacheStrategy: { ttl: 60 }
    // }).withAccelerateInfo();
    // console.log('Cache info:', usersWithInfo.info);
    // console.log('Data:', usersWithInfo.data);
    
    // Example 4: Cache invalidation
    console.log('Example 4: Cache invalidation');
    // await prisma.$accelerate.invalidate({ tags: ['users'] });
    // await prisma.$accelerate.invalidateAll(); // Invalidate all cache
    
    console.log('✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in example usage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment the line below to run the examples
// exampleUsage();

console.log('📝 Prisma client with Accelerate is ready to use!');
console.log('Import it in your files with: import prisma from "./src/prisma"');
console.log('Uncomment the examples in src/example-usage.ts to see how to use caching features.');