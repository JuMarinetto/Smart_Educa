const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYxNjA5NSwiZXhwIjoyMDg4MTkyMDk1fQ.kMhJ6TaUbZ4FAelOU3JAxpC1meCo9OBnZ3e5f1NRbZs";

// Use the admin auth client to list users
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function syncProfiles() {
    console.log("--- Syncing Users to Profiles ---");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    console.log(`Found ${users.length} users in auth.users.`);

    for (const user of users) {
        console.log(`Checking profile for user: ${user.email} (${user.id})`);

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) {
            console.log(`Creating ADMIN profile for ${user.email}...`);
            const { error: iError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: user.email,
                    nome: user.user_metadata?.full_name || 'Usuário Admin',
                    perfil: 'ADMIN',
                    ativo: true
                });

            if (iError) {
                console.error(`Failed to create profile for ${user.email}:`, iError);
            } else {
                console.log(`Profile created successfully for ${user.email}.`);
            }
        } else {
            console.log(`Profile already exists for ${user.email}. Updating role to ADMIN for testing.`);
            await supabase.from('profiles').update({ perfil: 'ADMIN' }).eq('id', user.id);
        }
    }

    console.log("--- Sync Complete ---");
}

syncProfiles();
