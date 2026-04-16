-- =========================================================================
--  Projeto Escola IA - Configurações Globais de Branding (V2 - 4 Cores)
-- =========================================================================

-- Criar tabela primeiro se não existir
CREATE TABLE IF NOT EXISTS public.system_configurations (
  id text PRIMARY KEY DEFAULT 'global',
  primary_color text DEFAULT '#8b5cf6',
  bg_color text DEFAULT '#0f0a1e',
  card_color text DEFAULT '#1a1230',
  text_color text DEFAULT '#e8e4f0',
  border_radius integer DEFAULT 12,
  logo_url text DEFAULT 'assets/logo.png',
  school_name text DEFAULT 'SmartEduca',
  updated_at timestamp with time zone DEFAULT now()
);

-- Agora adicionar colunas se não existirem (Safe Migration para tabelas antigas)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_configurations' AND column_name='bg_color') THEN
        ALTER TABLE public.system_configurations ADD COLUMN bg_color text DEFAULT '#0f0a1e';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_configurations' AND column_name='card_color') THEN
        ALTER TABLE public.system_configurations ADD COLUMN card_color text DEFAULT '#1a1230';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_configurations' AND column_name='text_color') THEN
        ALTER TABLE public.system_configurations ADD COLUMN text_color text DEFAULT '#e8e4f0';
    END IF;
END $$;

-- Inserir ou Atualizar registro inicial
INSERT INTO public.system_configurations (id, primary_color, bg_color, card_color, text_color, border_radius, logo_url, school_name)
VALUES ('global', '#8b5cf6', '#0f0a1e', '#1a1230', '#e8e4f0', 12, 'assets/logo.png', 'SmartEduca')
ON CONFLICT (id) DO UPDATE SET
  bg_color = EXCLUDED.bg_color,
  card_color = EXCLUDED.card_color,
  text_color = EXCLUDED.text_color
WHERE public.system_configurations.bg_color IS NULL 
   OR public.system_configurations.card_color IS NULL 
   OR public.system_configurations.text_color IS NULL;

-- RLS (Row Level Security)
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar erro de duplicidade
DROP POLICY IF EXISTS "Public Read Access" ON public.system_configurations;
DROP POLICY IF EXISTS "Admins Update Access" ON public.system_configurations;

-- Todos podem ler as configurações
CREATE POLICY "Public Read Access" 
ON public.system_configurations FOR SELECT 
USING (true);

-- Apenas admins podem atualizar
CREATE POLICY "Admins Update Access" 
ON public.system_configurations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.perfil = 'ADMIN'
  )
);
