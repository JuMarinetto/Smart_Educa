-- ============================================================
--  SmartEduca - Script de Reset de Dados
--  Apaga TODOS os dados das tabelas mantendo a estrutura.
--  Execute no SQL Editor do Supabase (ou psql).
--
--  ⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!
--      Faça um backup antes de executar.
-- ============================================================

BEGIN;

-- ─── 1. Dados de progresso e resultados (sem dependentes) ────────────────────
TRUNCATE TABLE assessment_snapshots    RESTART IDENTITY CASCADE;
TRUNCATE TABLE student_progress        RESTART IDENTITY CASCADE;
TRUNCATE TABLE certificates            RESTART IDENTITY CASCADE;

-- ─── 2. Vínculos de avaliações ───────────────────────────────────────────────
TRUNCATE TABLE assessment_questions    RESTART IDENTITY CASCADE;

-- ─── 3. Avaliações ───────────────────────────────────────────────────────────
TRUNCATE TABLE assessments             RESTART IDENTITY CASCADE;

-- ─── 4. Estrutura dos cursos ─────────────────────────────────────────────────
TRUNCATE TABLE course_contents         RESTART IDENTITY CASCADE;
TRUNCATE TABLE topics                  RESTART IDENTITY CASCADE;

-- ─── 5. Alternativas e questões ──────────────────────────────────────────────
TRUNCATE TABLE alternatives            RESTART IDENTITY CASCADE;
TRUNCATE TABLE questions               RESTART IDENTITY CASCADE;

-- ─── 6. Conteúdos e áreas de conhecimento ────────────────────────────────────
TRUNCATE TABLE contents                RESTART IDENTITY CASCADE;
TRUNCATE TABLE knowledge_areas         RESTART IDENTITY CASCADE;

-- ─── 7. Vínculos de turmas ───────────────────────────────────────────────────
TRUNCATE TABLE class_students          RESTART IDENTITY CASCADE;
TRUNCATE TABLE class_courses           RESTART IDENTITY CASCADE;

-- ─── 8. Turmas e cursos ──────────────────────────────────────────────────────
TRUNCATE TABLE classes                 RESTART IDENTITY CASCADE;
TRUNCATE TABLE courses                 RESTART IDENTITY CASCADE;

-- ─── 9. Perfis de usuários (NÃO apaga auth.users do Supabase) ────────────────
--  Descomente a linha abaixo APENAS se quiser apagar perfis também:
-- TRUNCATE TABLE profiles             RESTART IDENTITY CASCADE;

COMMIT;

-- ============================================================
--  ✅ Limpeza concluída!
--  As tabelas estão vazias mas a estrutura foi mantida.
-- ============================================================


-- ============================================================
--  OPCIONAL: Scripts modulares (execute individualmente)
-- ============================================================

-- Apagar só o progresso dos alunos:
-- TRUNCATE TABLE student_progress, certificates, assessment_snapshots RESTART IDENTITY CASCADE;

-- Apagar só avaliações e resultados:
-- TRUNCATE TABLE assessment_snapshots, assessment_questions, assessments RESTART IDENTITY CASCADE;

-- Apagar só conteúdo/cursos (mantém alunos e turmas):
-- TRUNCATE TABLE course_contents, topics, contents, knowledge_areas, class_courses, class_students, courses, classes RESTART IDENTITY CASCADE;
