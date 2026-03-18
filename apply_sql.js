const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:N4cdWEqPPLZ4kwg4@db.ykglesravcuazuqpfmjy.supabase.co:5432/postgres";

async function applyMigrations() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Supabase DB.");

        const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
        // Correct order based on dependencies:
        const files = [
            '20260304000002_full_schema.sql',         // Create tables first
            '20260304000001_audit_and_ltree.sql',     // Add extensions and audit tables
            '20260304000000_submit_assessment_rpc.sql', // Create RPC functions referencing tables
            '20260304000003_rls_and_persistence.sql'  // Apply RLS and triggers
        ];

        for (const file of files) {
            console.log(`Applying migration: ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

            // Note: This applies the whole file at once. 
            // If there are multiple statements that need separate execution, 
            // the pg driver handles it if they are separated by semicolons, 
            // but some complex scripts might fail if they expect a specific environment.
            await client.query(sql);
            console.log(`Successfully applied ${file}.`);
        }

        console.log("All migrations applied successfully!");
    } catch (err) {
        console.error("Error applying migrations:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigrations();
