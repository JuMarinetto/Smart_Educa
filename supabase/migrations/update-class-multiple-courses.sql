-- =========================================================================
--  Projeto Escola IA - Relacionamento Turma x Múltiplos Cursos
-- =========================================================================

-- 1. Criar tabela de junção class_courses
CREATE TABLE IF NOT EXISTS public.class_courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_turma uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  id_curso uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(id_turma, id_curso)
);

-- 2. Habilitar RLS e adicionar política
ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_class_courses" ON public.class_courses FOR ALL USING (true) WITH CHECK (true);

-- 3. Migrar dados existentes da tabela classes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='id_curso') THEN
        INSERT INTO public.class_courses (id_turma, id_curso)
        SELECT id, id_curso FROM public.classes WHERE id_curso IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Nota: Não vamos remover a coluna classes.id_curso imediatamente para evitar quebras
-- em outras partes do sistema que ainda não foram atualizadas.
