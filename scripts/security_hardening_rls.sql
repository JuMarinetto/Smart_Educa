-- ============================================================
--  SmartEduca - Script de Hardening de Segurança RLS
--  Corrige a RLS aberta deixada por restore-data-visibility.sql
--
--  ⚠️  Execute no SQL Editor do Supabase (projeto: ykglesravcuazuqpfmjy)
--  ℹ️  Como o sistema usa login customizado (não Supabase Auth),
--      mantemos SELECT público na tabela profiles para o login funcionar.
--      O bloqueio principal é em ESCRITA pública.
-- ============================================================

BEGIN;

-- ─── 1. Remove as políticas abertas em todas as tabelas ──────────────────────
DO $$ 
DECLARE 
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
      'profiles', 'courses', 'topics', 'contents', 'course_contents',
      'knowledge_areas', 'questions', 'alternatives', 'classes',
      'class_students', 'class_courses', 'assessments', 'assessment_questions',
      'assessment_snapshots', 'student_progress', 'certificates'
    ];
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        -- Remove a política de acesso total anterior
        EXECUTE format(
          'DROP POLICY IF EXISTS "Acesso público temporário para %I" ON public.%I',
          tbl, tbl
        );
        -- Garante que RLS está ativo
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- ─── 2. Tabela PROFILES - Leitura pública (necessário para login customizado) ─
--  O sistema usa .eq('email', email).eq('senha', senha) sem auth.uid()
--  Portanto mantemos SELECT aberto, mas BLOQUEAMOS escrita pública.

DROP POLICY IF EXISTS "Allow public read on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block public write on profiles insert" ON public.profiles;
DROP POLICY IF EXISTS "Block public write on profiles update" ON public.profiles;
DROP POLICY IF EXISTS "Block public write on profiles delete" ON public.profiles;

-- SELECT: público (necessário para login customizado)
CREATE POLICY "Allow public read on profiles" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);

-- INSERT: bloqueado para anon (apenas authenticated pode criar via admin)
CREATE POLICY "Block public write on profiles insert" ON public.profiles
  FOR INSERT TO anon WITH CHECK (false);

-- UPDATE: somente autenticados (admin via app) 
CREATE POLICY "Block public write on profiles update" ON public.profiles
  FOR UPDATE TO anon USING (false) WITH CHECK (false);

-- DELETE: somente autenticados (admin via app)
CREATE POLICY "Block public write on profiles delete" ON public.profiles
  FOR DELETE TO anon USING (false);

-- ─── 3. Tabelas de conteúdo - apenas leitura anônima ─────────────────────────
DO $$
DECLARE 
    tbl TEXT;
    read_tables TEXT[] := ARRAY[
      'courses', 'topics', 'contents', 'course_contents',
      'knowledge_areas', 'questions', 'alternatives',
      'classes', 'class_students', 'class_courses',
      'assessments', 'assessment_questions'
    ];
BEGIN
    FOREACH tbl IN ARRAY read_tables LOOP
        -- Somente leitura para qualquer usuário (app precisa para funcionar)
        EXECUTE format(
          'DROP POLICY IF EXISTS "Allow public read on %I" ON public.%I',
          tbl, tbl
        );
        EXECUTE format(
          'CREATE POLICY "Allow public read on %I" ON public.%I FOR SELECT TO anon, authenticated USING (true)',
          tbl, tbl
        );
        -- Bloqueia escrita anônima
        EXECUTE format(
          'DROP POLICY IF EXISTS "Block anon write on %I" ON public.%I',
          tbl, tbl
        );
        EXECUTE format(
          'CREATE POLICY "Block anon write on %I" ON public.%I FOR INSERT TO anon WITH CHECK (false)',
          tbl, tbl
        );
    END LOOP;
END $$;

-- ─── 4. Tabelas de progresso e resultados ────────────────────────────────────
-- student_progress e assessment_snapshots: leitura e escrita por anon
-- (necessário porque o app usa anon key — sem Supabase Auth)

DROP POLICY IF EXISTS "Allow app access on student_progress" ON public.student_progress;
CREATE POLICY "Allow app access on student_progress" ON public.student_progress
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow app access on assessment_snapshots" ON public.assessment_snapshots;
CREATE POLICY "Allow app access on assessment_snapshots" ON public.assessment_snapshots
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow app access on certificates" ON public.certificates;
CREATE POLICY "Allow app access on certificates" ON public.certificates
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

COMMIT;

-- ============================================================
--  ✅ Hardening concluído!
--
--  Estado após execução:
--  - profiles: escrita anônima BLOQUEADA, leitura aberta (login customizado)
--  - Tabelas de conteúdo: somente leitura anônima
--  - Progresso, snapshots, certificados: acesso total (app usa anon key)
--
--  🔒 PRÓXIMO PASSO RECOMENDADO (médio prazo):
--     Migrar login para Supabase Auth nativo (supabase.auth.signInWithPassword)
--     para eliminar completamente o acesso anônimo e usar auth.uid() nas policies.
-- ============================================================
