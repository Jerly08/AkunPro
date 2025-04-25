// Simple Edge-compatible database client
import { PrismaClient } from '@prisma/client';

// Create a single instance for Edge functions
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, create a new instance for each request
  // to avoid issues with Turbopack hot reloading
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  // Test connection
  prisma.$connect()
    .then(() => console.log('Edge Prisma client connected'))
    .catch(e => console.error('Edge Prisma connection error:', e));
}

export default prisma; 