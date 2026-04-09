-- =========================================================================
--  Projeto Escola IA - Novas Tabelas (Progressão, Acesso e Certificados)
-- =========================================================================

-- 1. Tabela de Controle de Progressão do Estudante (Regra 3.4)
CREATE TABLE IF NOT EXISTS public.student_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_aluno uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_conteudo uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO')) DEFAULT 'NAO_INICIADO',
  data_primeiro_acesso timestamp with time zone,
  data_ultima_visualizacao timestamp with time zone,
  porcentagem_concluida numeric(5,2) DEFAULT 0.00,
  data_conclusao timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Index para buscas rápidas por aluno
CREATE INDEX idx_student_progress_aluno ON public.student_progress(id_aluno);

-- RLS Progressão
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_student_progress" ON public.student_progress FOR ALL USING (true) WITH CHECK (true);


-- 2. Tabela de Logs de Acesso (Auditoria - Regra 7.1)
CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_entidade uuid, -- Pode ser aula,avaliacao,curso
  tipo_entidade text, -- AULA, AVALIACAO, SISTEMA, CURSO, etc
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  metadata jsonb, -- IP, UserAgent, Device context etc.
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Access Logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_access_logs" ON public.access_logs FOR ALL USING (true) WITH CHECK (true);


-- 3. Tabela de Certificados (Regra 8.1.6)
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_aluno uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_curso uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  data_emissao timestamp with time zone DEFAULT now(),
  data_validade timestamp with time zone,
  codigo_verificacao text UNIQUE NOT NULL,
  url_pdf text, -- Link pro bucket do storage
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Certificados
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_certificates" ON public.certificates FOR ALL USING (true) WITH CHECK (true);
