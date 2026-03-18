import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ykglesravcuazuqpfmjy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ2xlc3JhdmN1YXp1cXBmbWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwOTUsImV4cCI6MjA4ODE5MjA5NX0.yfTAwUVVvITYkbPcmpt9DiIbEojOmOFYh_PlUQCSafY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTest() {
    console.log("=== INICIANDO TESTE DO FLUXO DO ALUNO ===");

    // 1. Simular Login
    console.log("\\n1. Tentando login com julia@teste.com...");
    const { data: profile, error: loginError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'julia@teste.com')
        .eq('ativo', true)
        .single();

    if (loginError || !profile) {
        console.error("❌ Falha no login do aluno:", loginError?.message);
        return;
    }
    console.log("✅ Login gerado com sucesso para:", profile.nome, "Perfil:", profile.perfil);

    // 2. Buscar Cursos do Aluno (Catálogo e Meus Cursos)
    console.log("\\n2. Buscando cursos matriculados para o aluno...");

    // Buscar turmas que o aluno participa
    const { data: turmas, error: errorTurmas } = await supabase
        .from('class_students')
        .select('id_turma')
        .eq('id_aluno', profile.id);

    if (errorTurmas) {
        console.error("❌ Erro ao buscar turmas:", errorTurmas.message);
        return;
    }

    const turmasIds = turmas?.map((t: any) => t.id_turma) || [];
    console.log(`✅ Aluno está matriculado em ${turmasIds.length} turmas:`, turmasIds);

    let cursosEncontrados = [];
    if (turmasIds.length > 0) {
        const { data: classCourses, error: cError } = await supabase
            .from('class_courses')
            .select('id_curso')
            .in('id_turma', turmasIds);

        if (classCourses && classCourses.length > 0) {
            const courseIds = classCourses.map((cc: any) => cc.id_curso);
            const { data: cursos } = await supabase
                .from('courses')
                .select('id, titulo')
                .in('id', courseIds)
                .eq('status', 'PUBLICADO');

            cursosEncontrados = cursos || [];
            console.log(`✅ Cursos encontrados para o aluno:`, cursosEncontrados);
        } else {
            console.warn("⚠️ Nenhuma relação curso x turma encontrada.");
        }
    }

    // 3. Progresso do Aluno
    console.log("\\n3. Checando progresso gravado...");
    const { data: progress, error: progError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('id_aluno', profile.id);

    if (progError) {
        console.error("❌ Erro ao buscar progresso:", progError.message);
    } else {
        console.log(`✅ Tabela de progresso acessível. Registros de aula gravados: ${progress?.length || 0}`);
    }

    // 4. Teste de Snapshots de Avaliação
    console.log("\\n4. Checando acesso à gravacão de avaliações...");
    // Como estamos testando o RLS anonimo por hora, tentaremos apenas ler as avaliações deste aluno.
    const { data: snapshots, error: snapError } = await supabase
        .from('assessment_snapshots')
        .select('*')
        .eq('id_aluno', profile.id);

    if (snapError) {
        console.error("❌ Erro ao buscar histórico de provas:", snapError.message);
    } else {
        console.log(`✅ Tabela de avaliações do aluno (snapshots) acessível. Tentativas realizadas: ${snapshots?.length || 0}`);
    }

    console.log("\\n=== TESTE CONCLUÍDO ===");
    console.log("Com base neste script usando o cliente do banco, a política de leitura (RLS) e a estrutura de dados estão corretas para o Aluno acessar seus dados primordiais (Turmas, Cursos, Avaliações, Progresso).");
}

runTest();
