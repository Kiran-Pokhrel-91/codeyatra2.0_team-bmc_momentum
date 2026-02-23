import pg from 'pg';

const { Pool } = pg;

// Read from environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
