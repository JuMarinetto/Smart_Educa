-- Execute este script no Editor SQL do Supabase Dashboard
-- Dashboard > SQL Editor > New Query > Cole e execute

-- Permitir INSERT, SELECT, UPDATE, DELETE para todos (anon + authenticated)
-- na tabela assessment_snapshots
CREATE POLICY "allow_all_assessment_snapshots"
  ON public.assessment_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Também liberar a tabela assessment_questions (usada para vincular questões)
CREATE POLICY "allow_all_assessment_questions"
  ON public.assessment_questions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Liberar a tabela assessments (para o admin CRUD)
CREATE POLICY "allow_all_assessments"
  ON public.assessments
  FOR ALL
  USING (true)
  WITH CHECK (true);
