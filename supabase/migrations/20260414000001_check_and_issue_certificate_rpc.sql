-- Criar RPC para verificação e emissão de certificado no lado do servidor (Performance)
CREATE OR REPLACE FUNCTION check_and_issue_certificate(
  p_student_id UUID,
  p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_already_has BOOLEAN;
  v_total_contents INT;
  v_completed_contents INT;
  v_cert_code TEXT;
BEGIN
  -- 1. Verifica se já existe certificado
  SELECT EXISTS (
    SELECT 1 FROM public.certificates 
    WHERE id_aluno = p_student_id AND id_curso = p_course_id
  ) INTO v_already_has;

  IF v_already_has THEN
    RETURN TRUE;
  END IF;

  -- 2. Coleta total de conteúdos do curso (Regra: Apenas aulas/conteúdos, ignorando tópicos sem conteúdo)
  -- Buscamos na tabela topics vinculada a course_contents
  SELECT COUNT(DISTINCT cc.id_conteudo) INTO v_total_contents
  FROM public.topics t
  JOIN public.course_contents cc ON cc.id_topico = t.id
  WHERE t.id_curso = p_course_id
    AND (cc.tipo IS NULL OR cc.tipo = 'conteudo')
    AND cc.id_conteudo IS NOT NULL;

  -- 3. Se não tem conteúdos, emite direto
  IF v_total_contents = 0 THEN
    v_cert_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)) || '-' || to_char(now(), 'MMYY');
    
    INSERT INTO public.certificates (id_aluno, id_curso, codigo_verificacao, data_emissao)
    VALUES (p_student_id, p_course_id, v_cert_code, now());
    
    RETURN TRUE;
  END IF;

  -- 4. Conta quantos conteúdos o aluno concluiu
  SELECT COUNT(DISTINCT sp.id_conteudo) INTO v_completed_contents
  FROM public.student_progress sp
  WHERE sp.id_aluno = p_student_id
    AND sp.status = 'CONCLUIDO'
    AND sp.id_conteudo IN (
      SELECT cc.id_conteudo
      FROM public.topics t
      JOIN public.course_contents cc ON cc.id_topico = t.id
      WHERE t.id_curso = p_course_id
        AND (cc.tipo IS NULL OR cc.tipo = 'conteudo')
        AND cc.id_conteudo IS NOT NULL
    );

  -- 5. Se concluiu tudo, emite
  IF v_completed_contents >= v_total_contents THEN
    v_cert_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)) || '-' || to_char(now(), 'MMYY');
    
    INSERT INTO public.certificates (id_aluno, id_curso, codigo_verificacao, data_emissao)
    VALUES (p_student_id, p_course_id, v_cert_code, now());
    
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_and_issue_certificate IS 'Verifica conclusão de curso e emite certificado em uma única transação no servidor';
