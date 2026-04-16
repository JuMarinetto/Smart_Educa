
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS nota_corte DECIMAL(5,2) DEFAULT 6.0;

COMMENT ON COLUMN public.assessments.nota_corte IS 'Nota mínima necessária para aprovação global na avaliação';
