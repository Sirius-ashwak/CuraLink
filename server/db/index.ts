import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database connection details from environment variables
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/curalink';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString,
});

// Create a Drizzle ORM instance
export const db = drizzle(pool);

// Export the pool for direct query execution if needed
export { pool };