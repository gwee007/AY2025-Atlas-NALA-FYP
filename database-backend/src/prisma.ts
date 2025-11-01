import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Initialize Prisma Client with Accelerate extension
// The Accelerate extension enables caching and connection pooling
const prisma = new PrismaClient().$extends(withAccelerate());

export default prisma;