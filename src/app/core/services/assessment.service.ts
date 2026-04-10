import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Assessment, StudentAssessment, AssessmentSnapshot } from '../models/assessment.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private supabase = inject(SupabaseService).client;

  /**
   * Inicia uma tentativa de avaliação para um aluno:
   * busca questões + conta tentativas anteriores em paralelo,
   * grava o snapshot imutável e retorna o registro criado.
   */
  async startAssessment(assessmentId: string, studentId: string) {
    // Busca questões + contagem de tentativas em PARALELO
    const [questionsResult, { count: attemptCount }] = await Promise.all([
      // Query 1: busca questões + alternativas pelo assessment (JOIN)
      this.supabase
        .from('assessment_questions')
        .select(`
          questions:id_questao (
            id, enunciado, id_conteudo,
            alternatives (*)
          )
        `)
        .eq('id_avaliacao', assessmentId),

      // Query 2: conta tentativas anteriores
      this.supabase
        .from('assessment_snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('id_aluno', studentId)
        .eq('id_avaliacao_original', assessmentId)
    ]);

    // Desembala o resultado aninhado das questões
    const questions = (questionsResult.data || [])
      .map((row: any) => row.questions)
      .filter(Boolean);

    // Monta o JSON imutável (inclui id_conteudo para validação por conteúdo na RPC)
    const jsonQuestoes = questions.map((q: any) => ({
      codigo: q.id,
      enunciado: q.enunciado,
      id_conteudo: q.id_conteudo ?? null,
      alternativas: q.alternatives,
      pontuacao: 10
    }));

    // Insere snapshot com número da tentativa
    const { data: snapshot } = await this.supabase
      .from('assessment_snapshots')
      .insert({
        id_avaliacao_original: assessmentId,
        id_aluno: studentId,
        data_aplicacao: new Date().toISOString(),
        numero_tentativa: (attemptCount || 0) + 1,
        json_questoes: jsonQuestoes
      })
      .select()
      .single();

    return snapshot;
  }

  /**
   * Envia as respostas do aluno para a RPC segura no Supabase.
   * A validação, cronometragem e cálculo de nota são feitos pelo servidor.
   */
  async submitAssessment(attemptId: string, answers: any[]) {
    const { data: result, error } = await this.supabase.rpc('submit_assessment_secure', {
      p_attempt_id: attemptId,
      p_answers: answers
    });

    if (error) {
      console.error('Erro na submissão da avaliação:', error);
      throw error;
    }

    return result;
  }

  /** Retorna todas as avaliações com status PUBLICADA. */
  getAvailableAssessments() {
    return from(
      this.supabase
        .from('assessments')
        .select('*')
        .eq('status', 'PUBLICADA')
        .order('created_at', { ascending: false })
    ).pipe(map(res => (res.data as Assessment[]) || []));
  }

  /** Retorna todas as avaliações (uso exclusivo do admin). */
  getAllAssessments() {
    return from(
      this.supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map(res => (res.data as Assessment[]) || []));
  }

  /** Busca uma avaliação pelo ID sem carregar a tabela inteira. */
  getAssessmentById(id: string) {
    return from(
      this.supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(map(res => res.data as Assessment | null));
  }

  /**
   * Carrega questões + alternativas + conteúdo de uma avaliação em uma única query.
   */
  getQuestionsForAssessment(assessmentId: string) {
    return from(
      this.supabase
        .from('assessment_questions')
        .select(`
          id_questao,
          questions:id_questao(
            id, titulo, enunciado, codigo, id_conteudo,
            alternatives(*),
            contents:id_conteudo(id, titulo_tema)
          )
        `)
        .eq('id_avaliacao', assessmentId)
    ).pipe(
      map(res => {
        const rows = (res.data as any[]) || [];
        return rows.map(row => row.questions).filter(Boolean);
      })
    );
  }

  async createAssessment(assessment: Partial<Assessment>) {
    return await this.supabase.from('assessments').insert(assessment).select().single();
  }

  async updateAssessment(id: string, assessment: Partial<Assessment>) {
    return await this.supabase.from('assessments').update(assessment).eq('id', id);
  }

  async deleteAssessment(id: string) {
    // 1. Remove dependent records first
    await this.deleteSnapshotsByAssessmentId(id);
    await this.deleteQuestionsLinksByAssessmentId(id);

    // 2. Remove the assessment itself
    return await this.supabase.from('assessments').delete().eq('id', id);
  }

  /** Retorna questões vinculadas a uma avaliação com dados do conteúdo associado. */
  getAssessmentQuestions(assessmentId: string) {
    return from(
      this.supabase
        .from('assessment_questions')
        .select(`
          id, id_questao,
          questions:id_questao(
            id, titulo, enunciado, codigo, id_conteudo,
            contents:id_conteudo(id, titulo_tema)
          )
        `)
        .eq('id_avaliacao', assessmentId)
    ).pipe(map(res => (res.data as any[]) || []));
  }

  /** Salva apenas as regras de nota mínima por conteúdo sem alterar outros campos. */
  async updateAssessmentRules(id: string, regras_nota_minima_conteudo: Record<string, number>) {
    return await this.supabase
      .from('assessments')
      .update({ regras_nota_minima_conteudo })
      .eq('id', id);
  }

  /** Vincula uma lista de questões a uma avaliação. */
  async linkQuestionsToAssessment(assessmentId: string, questionIds: string[]) {
    const rows = questionIds.map(qId => ({ id_avaliacao: assessmentId, id_questao: qId }));
    return await this.supabase.from('assessment_questions').insert(rows);
  }

  /** Remove o vínculo de uma questão específica com uma avaliação. */
  async unlinkQuestionFromAssessment(assessmentId: string, questionId: string) {
    return await this.supabase
      .from('assessment_questions')
      .delete()
      .eq('id_avaliacao', assessmentId)
      .eq('id_questao', questionId);
  }

  /**
   * Salva as respostas do aluno diretamente em um snapshot (fluxo legado).
   * Mantido pois ainda é utilizado pelo AssessmentTakeComponent.
   */
  async saveStudentAssessment(assessmentId: string, studentId: string, answers: Record<string, string>) {
    const { count } = await this.supabase
      .from('assessment_snapshots')
      .select('id', { count: 'exact' })
      .eq('id_aluno', studentId)
      .eq('id_avaliacao_original', assessmentId);

    const respostas = Object.entries(answers).map(([questionId, alternativeId]) => ({
      id_questao: questionId,
      id_alternativa_escolhida: alternativeId
    }));

    const { data, error } = await this.supabase
      .from('assessment_snapshots')
      .insert({
        id_avaliacao_original: assessmentId,
        id_aluno: studentId,
        data_aplicacao: new Date().toISOString(),
        numero_tentativa: (count || 0) + 1,
        json_questoes: [],
        json_respostas_aluno: respostas
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  /** Retorna todas as avaliações concluídas por um aluno, ordenadas da mais recente. */
  getStudentCompletedAssessments(studentId: string) {
    return from(
      this.supabase
        .from('assessment_snapshots')
        .select(`
          *,
          avaliacao:assessments!inner(*)
        `)
        .eq('id_aluno', studentId)
        .order('data_aplicacao', { ascending: false })
    ).pipe(map(res => (res.data as any[]) || []));
  }

  /**
   * Verifica a elegibilidade do aluno para refazer a avaliação,
   * com base no status da tentativa mais recente.
   */
  getEligibility(studentId: string, assessmentId: string) {
    return from(
      this.supabase
        .from('assessment_snapshots')
        .select('*')
        .eq('id_aluno', studentId)
        .eq('id_avaliacao_original', assessmentId)
        .order('data_aplicacao', { ascending: false })
        .limit(1)
    ).pipe(map(res => {
      const snap = res.data?.[0] as AssessmentSnapshot;
      if (!snap) return null;

      return {
        id: snap.id,
        id_avaliacao: snap.id_avaliacao_original,
        id_aluno: snap.id_aluno,
        nota_final: snap.nota_obtida || 0,
        aprovado: snap.status_aprovacao ?? true,
        data_inicio: snap.data_aplicacao,
        data_fim: snap.status_aprovacao !== undefined ? new Date().toISOString() : undefined,
        reprovas_por_area: snap.areas_reprovadas
      } as StudentAssessment;
    }));
  }

  /**
   * Remove todos os snapshots (tentativas) vinculados a uma avaliação.
   */
  async deleteSnapshotsByAssessmentId(assessmentId: string) {
    return await this.supabase
      .from('assessment_snapshots')
      .delete()
      .eq('id_avaliacao_original', assessmentId);
  }

  /**
   * Remove todos os vínculos de questões de uma avaliação.
   */
  async deleteQuestionsLinksByAssessmentId(assessmentId: string) {
    return await this.supabase
      .from('assessment_questions')
      .delete()
      .eq('id_avaliacao', assessmentId);
  }

  /**
   * Busca a última tentativa finalizada de um aluno para uma avaliação específica.
   */
  async getLastSnapshot(studentId: string, assessmentId: string) {
    return await this.supabase
      .from('assessment_snapshots')
      .select('*')
      .eq('id_aluno', studentId)
      .eq('id_avaliacao_original', assessmentId)
      .not('status_aprovacao', 'is', null)
      .order('data_aplicacao', { ascending: false })
      .limit(1);
  }

  /**
   * Atualiza o resultado final de um snapshot.
   */
  async updateSnapshotResult(snapshotId: string, score: number, passed: boolean) {
    return await this.supabase
      .from('assessment_snapshots')
      .update({ nota_obtida: score, status_aprovacao: passed })
      .eq('id', snapshotId);
  }
}