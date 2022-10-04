import { Pool } from 'pg';

require('dotenv').config();

const pool = new Pool({
  database: process.env.DB,
  host: process.env.HOST,
  max: 20,
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
});

export default pool;