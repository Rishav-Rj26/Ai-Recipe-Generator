import dotenv from 'dotenv';

dotenv.config();

import { Pool } from 'pg';

const connectionUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;

if (connectionUrl) {
    connectionUrl.searchParams.set('sslmode', 'verify-full');
}

const pool = new Pool({
    connectionString: connectionUrl?.toString(),
    ssl: connectionUrl ? { rejectUnauthorized: true } : false
});

pool.on('connect', () => {
    console.log('Connected to Neon Postgres database');
});

pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
    process.exit(-1);
});

export default {
    query: (text, params) => pool.query(text, params),
    pool
};
