import prisma from './prisma';

async function testConnection() {
  try {
    // This will test if the client can connect
    console.log('Testing Prisma client connection...');
    
    // Try a simple query that doesn't require any tables
    const result = await prisma.$executeRaw`SELECT 1 as test`;
    console.log('✅ Prisma client initialized successfully!');
    console.log('Connection test result:', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Failed to initialize Prisma client:', error);
  } finally {
    process.exit();
  }
}

testConnection();