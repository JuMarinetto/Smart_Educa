const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = "postgresql://postgres:N4cdWEqPPLZ4kwg4@db.ykglesravcuazuqpfmjy.supabase.co:5432/postgres";

async function setup() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Supabase DB.");

        const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

        // 1. EXTENSIONS
        await client.query('CREATE EXTENSION IF NOT EXISTS ltree;');
        console.log("LTree extension enabled.");

        // 2. CORE TABLES (from full_schema.sql)
        // We'll run the statements that create tables first.
        const fullSchemaSql = fs.readFileSync(path.join(migrationsDir, '20260304000002_full_schema.sql'), 'utf8');
        // We can run the whole file, but let's be careful about things that might fail if 01 isn't there.
        // Actually, let's just run it.
        console.log("Applying full_schema.sql...");
        await client.query(fullSchemaSql);
        console.log("Full schema applied.");

        // 3. AUDIT & LTREE (from audit_and_ltree.sql)
        const auditSql = fs.readFileSync(path.join(migrationsDir, '20260304000001_audit_and_ltree.sql'), 'utf8');
        console.log("Applying audit_and_ltree.sql...");
        await client.query(auditSql);
        console.log("Audit and LTree paths applied.");

        // 4. RPC FUNCTIONS (from submit_assessment_rpc.sql)
        const rpcSql = fs.readFileSync(path.join(migrationsDir, '20260304000000_submit_assessment_rpc.sql'), 'utf8');
        console.log("Applying submit_assessment_rpc.sql...");
        await client.query(rpcSql);
        console.log("RPC functions applied.");

        // 5. RLS & PERSISTENCE (from rls_and_persistence.sql)
        const rlsSql = fs.readFileSync(path.join(migrationsDir, '20260304000003_rls_and_persistence.sql'), 'utf8');
        console.log("Applying rls_and_persistence.sql...");
        await client.query(rlsSql);
        console.log("RLS policies and triggers applied.");

        console.log("DATABASE SETUP COMPLETE!");
    } catch (err) {
        console.error("Setup failed:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

setup();
