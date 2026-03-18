const { Client } = require('pg');

const connectionString = "postgresql://postgres:N4cdWEqPPLZ4kwg4@db.ykglesravcuazuqpfmjy.supabase.co:5432/postgres";

async function listAllTables() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Supabase DB.");

        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log("Tables in 'public' schema:");
        res.rows.forEach(row => console.log(`- ${row.table_name}`));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

listAllTables();
