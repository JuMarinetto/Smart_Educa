-- Adição de colunas para suporte a Modo IA em Avaliações
ALTER TABLE public.assessments 
ADD COLUMN IF NOT EXISTS id_area_conhecimento uuid REFERENCES public.knowledge_areas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS qtd_questoes integer DEFAULT 0;

COMMENT ON COLUMN public.assessments.id_area_conhecimento IS 'Área de conhecimento base para geração automática via IA';
COMMENT ON COLUMN public.assessments.qtd_questoes IS 'Quantidade de questões sugerida para o modo de criação IA';
