-- ============================================================
--  Migração: Isolamento de Progresso por Curso
--  Relaciona o progresso do aluno a um curso específico.
-- ============================================================

BEGIN;

-- 1. Adiciona a coluna id_curso (uuid) referenciando courses(id)
ALTER TABLE student_progress ADD COLUMN IF NOT EXISTS id_curso uuid REFERENCES courses(id);

-- 2. Tenta mapear o id_curso para registros existentes baseando-se no id_conteudo.
--    Pega o primeiro curso encontrado que contém este conteúdo.
UPDATE student_progress sp
SET id_curso = (
    SELECT t.id_curso 
    FROM course_contents cc
    JOIN topics t ON t.id = cc.id_topico
    WHERE cc.id_conteudo = sp.id_conteudo
    LIMIT 1
)
WHERE sp.id_curso IS NULL;

-- 3. Identifica se existe uma constraint UNIQUE antiga sobre (id_aluno, id_conteudo)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_progress_id_aluno_id_conteudo_key' 
        OR conname = 'unique_student_content'
    ) THEN
        ALTER TABLE student_progress DROP CONSTRAINT IF EXISTS student_progress_id_aluno_id_conteudo_key;
        ALTER TABLE student_progress DROP CONSTRAINT IF EXISTS unique_student_content;
    END IF;
END $$;

-- 4. Cria a nova constraint UNIQUE incluindo id_curso
--    Garante que um aluno pode ter progresso em um conteúdo específico em diferentes cursos
ALTER TABLE student_progress ADD CONSTRAINT unique_student_content_course UNIQUE (id_aluno, id_conteudo, id_curso);

-- 5. Opcional: Adiciona índices para performance nas consultas do Dashboard
CREATE INDEX IF NOT EXISTS idx_student_progress_course ON student_progress(id_curso);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_course ON student_progress(id_aluno, id_curso);

COMMIT;
