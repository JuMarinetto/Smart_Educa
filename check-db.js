const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://ykglesravcuazuqpfmjy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY'
);

async function checkDatabase() {
    console.log('Verificando dados na tabela profiles...\n');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Erro ao consultar:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('Nenhum perfil encontrado no banco de dados!');
        return;
    }

    console.log(`Encontrados ${data.length} perfil(is):`);
    data.forEach((p, i) => {
        console.log(`\n--- Perfil ${i + 1} ---`);
        console.log(`ID: ${p.id}`);
        console.log(`Nome: ${p.nome}`);
        console.log(`Email: ${p.email}`);
        console.log(`Senha (armazenada): ${p.senha || '[Vazio/Nao existe]'}`);
        console.log(`Perfil: ${p.perfil}`);
        console.log(`Ativo: ${p.ativo}`);
    });
}

checkDatabase();
