-- Function to securely calculate and submit an assessment
-- Function to securely calculate and submit an assessment
CREATE OR REPLACE FUNCTION submit_assessment_secure(
  p_snapshot_id UUID,
  p_answers JSONB -- [{ "question_id": "uuid", "selected_alternative_id": "uuid" }]
) RETURNS JSONB AS $$
DECLARE
  v_snapshot_row RECORD;
  v_assessment_row RECORD;
  v_nota_total NUMERIC := 0;
  v_nota_corte_total NUMERIC;
  v_regras_areas JSONB;
  
  -- Para agrupar notas por area
  v_score_por_area JSONB := '{}'::jsonb;
  v_questoes_por_area JSONB := '{}'::jsonb;
  v_reprovas_areas JSONB := '[]'::jsonb;
  
  v_question RECORD;
  v_answer RECORD;
  v_is_correct BOOLEAN;
  v_area_id TEXT;
  
  v_tempo_gasto INT;
  v_aprovado BOOLEAN := TRUE;
  
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- 1. Obter o snapshot do aluno (que agora atua como a tentativa oficial)
  SELECT * INTO v_snapshot_row 
  FROM assessment_snapshots 
  WHERE id = p_snapshot_id AND status_aprovacao IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tentativa (Snapshot) não encontrada ou já finalizada.';
  END IF;

  -- 2. Obter configurações da avaliação
  SELECT * INTO v_assessment_row 
  FROM assessments 
  WHERE id = v_snapshot_row.id_avaliacao_original;

  v_nota_corte_total := v_assessment_row.nota_corte;
  v_regras_areas := COALESCE(v_assessment_row.regras_nota_minima_area, '{}'::JSONB);

  -- 3. Calcular Diferença de Tempo Real (Backend Clock)
  v_tempo_gasto := EXTRACT(EPOCH FROM (v_now - v_snapshot_row.data_aplicacao))::INT;

  -- 4. Avaliar as respostas baseadas no array json_questoes do próprio snapshot!
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    -- Busca a questão no JSON salvo no snapshot
    SELECT * INTO v_question 
    FROM jsonb_array_elements(v_snapshot_row.json_questoes) AS q
    WHERE (q->>'codigo')::TEXT = (v_answer.value->>'question_id')::TEXT;
      
    IF FOUND THEN
      v_area_id := v_question.value->>'area_conhecimento';
      
      -- Verifica se a alternativa selecionada é correta no snapshot
      SELECT (elem->>'is_correta')::BOOLEAN INTO v_is_correct
      FROM jsonb_array_elements(v_question.value->'alternativas') AS elem
      WHERE (elem->>'id')::TEXT = (v_answer.value->>'selected_alternative_id')::TEXT;
      
      v_is_correct := COALESCE(v_is_correct, FALSE);
      
      -- Acumula total por área
      v_questoes_por_area := jsonb_set(
        v_questoes_por_area, 
        string_to_array(v_area_id, ','), 
        (COALESCE((v_questoes_por_area->>v_area_id)::NUMERIC, 0) + 1)::TEXT::JSONB
      );
      
      IF v_is_correct THEN
        v_nota_total := v_nota_total + COALESCE((v_question.value->>'pontuacao')::NUMERIC, 10);
        
        -- Soma acerto na área
        v_score_por_area := jsonb_set(
          v_score_por_area, 
          string_to_array(v_area_id, ','), 
          (COALESCE((v_score_por_area->>v_area_id)::NUMERIC, 0) + COALESCE((v_question.value->>'pontuacao')::NUMERIC, 10))::TEXT::JSONB
        );
      END IF;
    END IF;
  END LOOP;

  -- 5. Validação Dupla (Total e Por Área)
  IF v_nota_total < v_nota_corte_total THEN
    v_aprovado := FALSE;
  END IF;

  FOR v_area_id IN SELECT key FROM jsonb_each(v_regras_areas)
  LOOP
    IF COALESCE((v_score_por_area->>v_area_id)::NUMERIC, 0) < (v_regras_areas->>v_area_id)::NUMERIC THEN
      v_aprovado := FALSE;
      v_reprovas_areas := v_reprovas_areas || to_jsonb(v_area_id);
    END IF;
  END LOOP;

  -- 6. Atualizar o próprio snapshot com os resultados
  UPDATE assessment_snapshots SET
    json_respostas_aluno = p_answers,
    nota_obtida = v_nota_total,
    tempo_gasto_segundos = v_tempo_gasto,
    status_aprovacao = v_aprovado,
    areas_reprovadas = v_reprovas_areas
  WHERE id = p_snapshot_id;

  -- 7. Retornar os resultados processados
  RETURN json_build_object(
    'nota_final', v_nota_total,
    'aprovado', v_aprovado,
    'tempo_gasto_segundos', v_tempo_gasto,
    'reprovas_por_area', v_reprovas_areas,
    'score_por_area', v_score_por_area
  )::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
