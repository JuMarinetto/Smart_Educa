const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYxNjA5NSwiZXhwIjoyMDg4MTkyMDk1fQ.kMhJ6TaUbZ4FAelOU3JAxpC1meCo9OBnZ3e5f1NRbZs";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function finalCheck() {
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Final count of profiles: ${profiles.length}`);
        profiles.forEach(p => console.log(`- ${p.email}: ${p.perfil}`));
    }
}

finalCheck();
