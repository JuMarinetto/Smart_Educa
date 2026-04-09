-- Correção: Restaurar Visibilidade dos Dados
-- O projeto utiliza um sistema de login customizado que não se integra ao Auth do Supabase.
-- Por isso, o Banco de Dados vê todos os usuários como "públicos" (anônimos), 
-- bloqueando o acesso quando as regras exigem "Usuário Autenticado".

-- Este script retorna as permissões para o estado funcional anterior (acesso público),
-- permitindo que os registros sejam visualizados novamente.

DO $$ 
DECLARE 
    tbl TEXT;
    target_tables TEXT[] := ARRAY['knowledge_areas', 'contents', 'questions', 'alternatives', 'courses', 'topics', 'course_contents', 'classes', 'class_students', 'class_courses', 'assessments', 'assessment_questions', 'assessment_snapshots', 'student_progress', 'profiles'];
BEGIN
    FOREACH tbl IN ARRAY target_tables
    LOOP
        -- Remover as políticas restritivas anteriores
        EXECUTE format('DROP POLICY IF EXISTS "Admins have full access on %I" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON public.%I', tbl, tbl);
        
        -- Caso específico para a tabela profiles (removendo política de login)
        IF tbl = 'profiles' THEN
            DROP POLICY IF EXISTS "Public reading of profiles for login" ON public.profiles;
        END IF;

        -- Criar nova política de acesso total (necessário enquanto o login for customizado)
        EXECUTE format('CREATE POLICY "Acesso público temporário para %I" ON public.%I 
                        FOR ALL 
                        TO public 
                        USING (true)
                        WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;
