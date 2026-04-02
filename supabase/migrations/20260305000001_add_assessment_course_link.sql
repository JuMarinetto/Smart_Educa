-- Migration: Add id_curso field to assessments table
-- This allows assessments to be linked to specific courses for certificate issuance

ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS id_curso UUID REFERENCES public.courses(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_assessments_id_curso ON public.assessments(id_curso);

-- Update RLS policies to include the new field
-- (The existing policies should already cover this since they use 'FOR ALL')
