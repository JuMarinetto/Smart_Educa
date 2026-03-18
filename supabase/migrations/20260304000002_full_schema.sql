-- Escola IA: Full Database Schema Migration
-- Based on Section 2 and 7.1 / 8.1.6 requirements

-- 1. Profiles Table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo VARCHAR(50) UNIQUE,
    foto_perfil TEXT,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    email VARCHAR(100),
    data_nascimento DATE,
    telefone VARCHAR(20),
    cep VARCHAR(9),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    estado CHAR(2),
    cidade VARCHAR(100),
    perfil VARCHAR(20) CHECK (perfil IN ('ADMIN', 'PROFESSOR', 'ALUNO', 'GERENTE')) DEFAULT 'ALUNO',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, nome, perfil)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'ALUNO');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Knowledge Areas (Ensuring columns from 2.2)
CREATE TABLE IF NOT EXISTS public.knowledge_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.knowledge_areas(id) ON DELETE CASCADE,
    area_conhecimento VARCHAR(100) NOT NULL,
    permite_conteudo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. Contents (2.3)
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_area_conhecimento UUID REFERENCES public.knowledge_areas(id) ON DELETE SET NULL,
    titulo_tema VARCHAR(100) NOT NULL,
    descricao VARCHAR(150),
    conteudo_html TEXT,
    documento_url TEXT,
    versao INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. Questions & Alternatives (2.4)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE,
    titulo VARCHAR(255),
    enunciado TEXT NOT NULL,
    id_conteudo UUID REFERENCES public.contents(id) ON DELETE SET NULL,
    id_area_conhecimento UUID REFERENCES public.knowledge_areas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_questao UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    is_correta BOOLEAN DEFAULT false
);


-- 5. Courses and Structure (2.5)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_professor UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    titulo VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Ativo', 'Inativo')) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_curso UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    id_topico_pai UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    nome_topico VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.course_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_topico UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    id_conteudo UUID REFERENCES public.contents(id) ON DELETE CASCADE,
    versao_vinculada INTEGER, -- Captures version at link time
    ordem INTEGER DEFAULT 0
);


-- 6. Classes (2.6)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_turma VARCHAR(255) NOT NULL,
    id_professor UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    id_curso UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_turma UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    id_aluno UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    UNIQUE(id_turma, id_aluno)
);


-- 7. Assessments (2.7 & 3.8 Snapshots)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50), -- e.g., 'DIAGNOSTICA', 'FINAL'
    status VARCHAR(20) DEFAULT 'Ativo',
    modo_criacao VARCHAR(50), -- 'MANUAL', 'AUTOMATICO'
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    duracao INTEGER, -- in minutes
    cronometro BOOLEAN DEFAULT true,
    nota_total DECIMAL(5,2) DEFAULT 10.0,
    regras_nota_minima_area JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_avaliacao UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
    id_questao UUID REFERENCES public.questions(id) ON DELETE CASCADE,
    UNIQUE(id_avaliacao, id_questao)
);

-- Note: student_assessments and snapshots were partially defined in other migrations
-- Ensuring they match the requested Section 2 spec
CREATE TABLE IF NOT EXISTS public.assessment_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_avaliacao_original UUID REFERENCES public.assessments(id),
    id_aluno UUID REFERENCES public.profiles(id),
    data_aplicacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    numero_tentativa INTEGER,
    json_questoes JSONB,
    json_respostas_aluno JSONB,
    nota_obtida DECIMAL(4,2),
    tempo_gasto_segundos INTEGER,
    status_aprovacao BOOLEAN,
    areas_reprovadas JSONB
);


-- 8. Missing Tables (2.8)
CREATE TABLE IF NOT EXISTS public.student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_aluno UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_conteudo UUID REFERENCES public.contents(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO')) DEFAULT 'NAO_INICIADO',
    porcentagem_concluida DECIMAL(5,2) DEFAULT 0.0,
    ultima_interacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_aluno, id_conteudo)
);

CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    id_entidade UUID, -- content or assessment id
    tipo_entidade VARCHAR(50), -- 'CONTENT', 'ASSESSMENT'
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_fim TIMESTAMP WITH TIME ZONE,
    metadata JSONB -- IP, User-Agent, Device
);

CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_aluno UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_curso UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_validade TIMESTAMP WITH TIME ZONE,
    codigo_verificacao VARCHAR(100) UNIQUE NOT NULL,
    url_pdf TEXT
);

-- RLS Policies for all new tables (Simplified for now - can be refined per table)
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('profiles', 'contents', 'questions', 'alternatives', 'courses', 'topics', 'course_contents', 'classes', 'class_students', 'assessments', 'assessment_questions', 'assessment_snapshots', 'student_progress', 'access_logs', 'certificates')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public view for %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Public view for %I" ON public.%I FOR SELECT USING (true)', t, t);
    END LOOP;
END $$;
