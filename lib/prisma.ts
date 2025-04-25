/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

// PrismaClient singleton pattern for better performance
// This prevents multiple instances during hot reloads in development
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

// Type for global variable
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Use globalThis instead of global for Edge compatibility
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Get existing instance or create new one
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Function to mask password in database URL
function maskDatabaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // If there's a password, replace it with ***
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return a generic string
    return 'Invalid database URL format';
  }
}

// Test database connection with retry logic
async function testConnection(retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Connect to the database
      await prisma.$connect();
      
      // Only log if successfully connected
      console.log('\n🟢 Database connection established successfully\n');
      
      return true;
    } catch (error) {
      // Save error to log file instead of displaying in console
      const errorMessage = error instanceof Error ? error.message : String(error);
      const timestamp = new Date().toISOString();
      
      console.error(`\n🔴 Database connection attempt ${attempt}/${retries} failed: ${errorMessage}\n`);
      
      if (attempt < retries) {
        // Wait before retrying
        console.log(`\n⏳ Retrying in ${delay/1000} seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('\n❌ All database connection attempts failed\n');
        return false;
      }
    }
  }
  return false;
}

// Only in development - test database connection
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  
  // Test connection silently
  prisma.$connect()
    .then(() => {
      console.log('\n🟢 Database connection established successfully\n');
    })
    .catch((error) => {
      console.error('\n🔴 Database connection failed:', error, '\n');
    });
}

// Sanitasi dan validasi input untuk mencegah NoSQL injection
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Hapus karakter khusus yang bisa digunakan untuk injection
  return input
    .replace(/[${}()]/g, '')
    .replace(/\$/g, '')
    .replace(/'/g, "''")
    .trim();
}

// Validasi ID untuk mencegah manipulation
export function validateId(id: string): boolean {
  // Pastikan id adalah UUID yang valid
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Validasi email dengan regex yang ketat
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
}

export default prisma; 