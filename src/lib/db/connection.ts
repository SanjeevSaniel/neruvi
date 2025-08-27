import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
  }
  
  return db;
}

// Connection health check
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database connection (optional - for startup checks)
export async function initializeDatabase(): Promise<void> {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.warn('⚠️ Database connection failed - some features may not work');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Feature flag to check if database is enabled
export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.NEXT_PUBLIC_USE_DATABASE !== 'false');
}

// Type-safe database instance
export type DatabaseInstance = ReturnType<typeof getDatabase>;