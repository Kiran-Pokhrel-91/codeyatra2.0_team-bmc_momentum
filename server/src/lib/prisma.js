import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create a single instance of PrismaClient to be used across the application
// This prevents creating multiple connections to the database

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
