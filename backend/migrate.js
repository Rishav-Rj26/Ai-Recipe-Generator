import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Load environment variables from .env file
dotenv.config();

const connectionUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;

if (connectionUrl) {
    connectionUrl.searchParams.set('sslmode', 'verify-full');
}

const pool = new Pool({
    connectionString: connectionUrl?.toString(),
    ssl: connectionUrl ? { rejectUnauthorized: true } : false
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('Running database migration...');

        // Read the schema file
        const schemaPath = path.join(__dirname, 'config', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        //Execute the schema
        await client.query(schemaSql);

        console.log('Database migration completed successfully.');
        console.log('Tables created:');
        console.log('  -users');
        console.log('  -user_preferences');
        console.log('  -pantry_items');
        console.log('  -recipes');
        console.log('  -recipe_ingredients');
        console.log('  -recipe_nutrition');
        console.log('  -meal_plans');
        console.log('  -shopping_lists');

    } catch (error) {
        console.error('Error during database migration:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
