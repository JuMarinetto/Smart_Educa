-- Security Hardening: Proper RLS Policies
-- This script replaces the "public access" policies with role-based access control.

-- 1. Helper Function to check if user is Admin/Professor
CREATE OR REPLACE FUNCTION public.is_admin_or_professor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND perfil IN ('ADMIN', 'PROFESSOR', 'GERENTE')
    AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply strict policies to Administrative Tables
DO $$ 
DECLARE 
    tbl TEXT;
    target_tables TEXT[] := ARRAY['knowledge_areas', 'contents', 'questions', 'alternatives', 'courses', 'topics', 'course_contents', 'classes', 'class_students', 'class_courses', 'assessments', 'assessment_questions'];
BEGIN
    FOREACH tbl IN ARRAY target_tables
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

        -- Remove old public policies
        EXECUTE format('DROP POLICY IF EXISTS "Admins have full access on %I" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public view for %I" ON public.%I', tbl, tbl);

        -- 1. ADM/PROF: Full access
        EXECUTE format('CREATE POLICY "Admins have full access on %I" ON public.%I 
                        FOR ALL 
                        TO authenticated 
                        USING (public.is_admin_or_professor())
                        WITH CHECK (public.is_admin_or_professor())', tbl, tbl);

        -- 2. ALL AUTHENTICATED: Read access (Select)
        -- We allow all logged-in users to read for now, but we can refine this later to enrollment-based
        EXECUTE format('CREATE POLICY "Authenticated users can read %I" ON public.%I 
                        FOR SELECT 
                        TO authenticated 
                        USING (true)', tbl, tbl);
    END LOOP;
END $$;

-- 3. Profiles Table Special Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public view for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Admins can do everything
CREATE POLICY "Admins have full access on profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin_or_professor());

-- Users can read all profiles (for listing professors/students)
CREATE POLICY "Fully authenticated reading of profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 4. Student Results (assessment_snapshots)
ALTER TABLE public.assessment_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view for assessment_snapshots" ON public.assessment_snapshots;

CREATE POLICY "Admins can view all snapshots" ON public.assessment_snapshots
    FOR SELECT TO authenticated USING (public.is_admin_or_professor());

CREATE POLICY "Students can view own snapshots" ON public.assessment_snapshots
    FOR SELECT TO authenticated USING (auth.uid() = id_aluno);

CREATE POLICY "Students can create snapshots" ON public.assessment_snapshots
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id_aluno);
