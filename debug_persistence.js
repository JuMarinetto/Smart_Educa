const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjYxNjA5NSwiZXhwIjoyMDg4MTkyMDk1fQ.kMhJ6TaUbZ4FAelOU3JAxpC1meCo9OBnZ3e5f1NRbZs";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugPersistence() {
    console.log("--- Debugging Persistence ---");

    // 1. Check Profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
        console.error("Error fetching profiles:", pError);
    } else {
        console.log(`Found ${profiles.length} profiles:`);
        profiles.forEach(p => console.log(`- ID: ${p.id}, Nome: ${p.nome}, Perfil: ${p.perfil}, Ativo: ${p.ativo}`));
    }

    // 2. Check if a demo insertion works with Service Role (should always work)
    console.log("\nAttempting test insertion in knowledge_areas (Service Role)...");
    const { data: testArea, error: tError } = await supabase
        .from('knowledge_areas')
        .insert({ area_conhecimento: 'TESTE_SISTEMA_' + Date.now() })
        .select()
        .single();

    if (tError) {
        console.error("Insertion failed with Service Role:", tError);
    } else {
        console.log("Insertion successful with Service Role. ID:", testArea.id);
        // Clean up
        await supabase.from('knowledge_areas').delete().eq('id', testArea.id);
        console.log("Test area cleaned up.");
    }
}

debugPersistence();
