#! /usr/bin/env node

import pg from 'pg';

const { Client } = pg;

const SQL = `
-- Create enum types
DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  "targetDate" TIMESTAMP,
  status goal_status NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  "targetDate" TIMESTAMP,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  status milestone_status NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "goalId" UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  "estimatedMins" INTEGER,
  "dueDate" TIMESTAMP,
  priority priority NOT NULL DEFAULT 'MEDIUM',
  status task_status NOT NULL DEFAULT 'PENDING',
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "milestoneId" UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE
);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones("goalId");
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON tasks("milestoneId");
`;

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('Usage: node db/populatedb.js <database-url>');
    console.error('Or set DATABASE_URL environment variable');
    process.exit(1);
  }

  console.log('Seeding database...');
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    await client.query(SQL);
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
