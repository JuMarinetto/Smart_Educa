const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ykglesravcuazuqpfmjy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY'
);

async function dropFKAndCreateAdmin() {
    console.log('Tentando remover FK constraint via RPC...');

    // Try to call RPC to drop the FK
    const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;"
    });

    if (rpcError) {
        console.log('RPC nao disponivel:', rpcError.message);
        console.log('\n========================================');
        console.log('ACAO NECESSARIA:');
        console.log('========================================');
        console.log('Acesse o Supabase Dashboard:');
        console.log('https://supabase.com/dashboard/project/ykglesravcuazuqpfmjy/sql/new');
        console.log('');
        console.log('Cole e execute este SQL:');
        console.log('');
        console.log('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;');
        console.log('');
        console.log('Depois execute este para criar o admin:');
        console.log('');
        console.log("INSERT INTO public.profiles (id, nome, email, perfil, ativo)");
        console.log("VALUES (gen_random_uuid(), 'Administrador', 'admin@teste.com', 'ADMIN', true);");
        console.log('========================================');
    } else {
        console.log('FK removida com sucesso!');

        // Now insert the admin
        const { data, error } = await supabase.from('profiles').insert({
            id: crypto.randomUUID(),
            nome: 'Administrador',
            email: 'admin@teste.com',
            perfil: 'ADMIN',
            ativo: true
        }).select().single();

        if (error) {
            console.log('Erro ao criar admin:', error.message);
        } else {
            console.log('Admin criado! Email: admin@teste.com');
        }
    }
}

dropFKAndCreateAdmin();
