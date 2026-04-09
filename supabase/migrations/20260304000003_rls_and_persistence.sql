-- Migration 20260304000003: Backend RLS and CRUD Persistence
-- This script enables full CRUD for Admins and Professors on administrative tables.

-- List of tables to apply policies to
-- profiles, knowledge_areas, contents, questions, alternatives, courses, topics, course_contents, classes, class_students, assessments, assessment_questions

DO $$ 
DECLARE 
    tbl TEXT;
    target_tables TEXT[] := ARRAY['profiles', 'knowledge_areas', 'contents', 'questions', 'alternatives', 'courses', 'topics', 'course_contents', 'classes', 'class_students', 'assessments', 'assessment_questions'];
BEGIN
    FOREACH tbl IN ARRAY target_tables
    LOOP
        -- Enable RLS just in case it wasn't enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        -- 1. ADMIN Policy: FULL ACCESS (Temporarily open to public/anon for testing)
        EXECUTE format('DROP POLICY IF EXISTS "Admins have full access on %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admins have full access on %I" ON public.%I 
                        FOR ALL 
                        TO public 
                        USING (true)
                        WITH CHECK (true)', tbl, tbl);

    END LOOP;
END $$;

-- Backfill profiles from auth.users
INSERT INTO public.profiles (id, email, nome, perfil)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), 'ADMIN'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET perfil = 'ADMIN';

-- Special fix for the profiles table: 
-- Allow users to update their own profile data (name, photo, etc.)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger to auto-set id_area_conhecimento on questions from id_conteudo
CREATE OR REPLACE FUNCTION public.sync_question_area() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id_conteudo IS NOT NULL AND NEW.id_area_conhecimento IS NULL THEN
        SELECT id_area_conhecimento INTO NEW.id_area_conhecimento 
        FROM public.contents 
        WHERE id = NEW.id_conteudo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_question_area ON public.questions;
CREATE TRIGGER trg_sync_question_area
    BEFORE INSERT OR UPDATE OF id_conteudo
    ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_question_area();

-- Ensure profiles is populated correctly even without full metadata
ALTER TABLE public.profiles ALTER COLUMN nome SET DEFAULT 'Novo Usuário';
