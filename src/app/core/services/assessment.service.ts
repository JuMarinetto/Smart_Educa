import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Assessment, StudentAssessment, AssessmentSnapshot } from '../models/assessment.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  public supabase = inject(SupabaseService).client;

  async startAssessment(assessmentId: string, studentId: string) {
    // Busca as questões reais e alternativas para compor o JSON
    const { data: questions } = await this.supabase
      .from('questions')
      .select('*, alternatives(*)')
      .eq('id_avaliacao', assessmentId);

    // Cria o JSON imutável
    const json_questoes = (questions || []).map(q => ({
      codigo: q.id,
      enunciado: q.enunciado,
      area_conhecimento: q.id_area_conhecimento,
      alternativas: q.alternatives,
      pontuacao: 10 // Ponto fixo MVP
    }));

    // Conta as tentativas atuais para preencher numero_tentativa
    const { count } = await this.supabase
      .from('assessment_snapshots')
      .select('id', { count: 'exact' })
      .eq('id_aluno', studentId)
      .eq('id_avaliacao_original', assessmentId);

    // Insere UMA ÚNICA LINHA na tabela de snapshots, servindo como o histórico final oficial
    const { data: snapshot } = await this.supabase
      .from('assessment_snapshots')
      .insert({
        id_avaliacao_original: assessmentId,
        id_aluno: studentId,
        data_aplicacao: new Date().toISOString(),
        numero_tentativa: (count || 0) + 1,
        json_questoes: json_questoes
      })
      .select()
      .single();

    return snapshot;
  }

  async submitAssessment(attemptId: string, answers: any[]) {
    // Chama a RPC no Supabase que faz a validação dupla, 
    // cronometragem segura pelo servidor e cálculo de nota imutável via snapshots.
    const { data: result, error } = await this.supabase.rpc('submit_assessment_secure', {
      p_attempt_id: attemptId,
      p_answers: answers
    });

    if (error) {
      console.error('Erro na submissão da avaliação:', error);
      throw error;
    }

    // Após processar no DB, a linha em `student_assessments` já foi atualizada.
    // Retornamos os dados calculados para o Front-End mostrar o feedback (aprovado/reprovado).
    return result;
  }

  getAvailableAssessments() {
    return from(
      this.supabase
        .from('assessments')
        .select('*')
        .eq('status', 'PUBLICADA')
        .order('created_at', { ascending: false })
    ).pipe(map(res => (res.data as Assessment[]) || []));
  }

  // --- ADMIN CRUD OPs ---
  getAllAssessments() {
    return from(
      this.supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map(res => (res.data as Assessment[]) || []));
  }

  async createAssessment(assessment: Partial<Assessment>) {
    return await this.supabase.from('assessments').insert(assessment).select().single();
  }

  async updateAssessment(id: string, assessment: Partial<Assessment>) {
    return await this.supabase.from('assessments').update(assessment).eq('id', id);
  }

  async deleteAssessment(id: string) {
    return await this.supabase.from('assessments').delete().eq('id', id);
  }

  // --- ASSESSMENT ↔ QUESTIONS JUNCTION ---
  getAssessmentQuestions(assessmentId: string) {
    return from(
      this.supabase
        .from('assessment_questions')
        .select('id, id_questao, questions:id_questao(id, titulo, enunciado, codigo)')
        .eq('id_avaliacao', assessmentId)
    ).pipe(map(res => (res.data as any[]) || []));
  }

  async linkQuestionsToAssessment(assessmentId: string, questionIds: string[]) {
    const rows = questionIds.map(qId => ({ id_avaliacao: assessmentId, id_questao: qId }));
    return await this.supabase.from('assessment_questions').insert(rows);
  }

  async unlinkQuestionFromAssessment(assessmentId: string, questionId: string) {
    return await this.supabase
      .from('assessment_questions')
      .delete()
      .eq('id_avaliacao', assessmentId)
      .eq('id_questao', questionId);
  }
  // -----------------------

  // --- STUDENT EXAM FLOW ---
  getQuestionsWithAlternatives(questionIds: string[]) {
    return from(
      this.supabase
        .from('questions')
        .select('*, alternatives(*)')
        .in('id', questionIds)
    ).pipe(map(res => (res.data as any[]) || []));
  }

  async saveStudentAssessment(assessmentId: string, studentId: string, answers: Record<string, string>) {
    // Count existing attempts
    const { count } = await this.supabase
      .from('assessment_snapshots')
      .select('id', { count: 'exact' })
      .eq('id_aluno', studentId)
      .eq('id_avaliacao_original', assessmentId);

    // Convert answers to array format for storage
    const respostas = Object.entries(answers).map(([questionId, alternativeId]) => ({
      id_questao: questionId,
      id_alternativa_escolhida: alternativeId
    }));

    // Insert into assessment_snapshots
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
  // -----------------------

  // --- COMPLETED EXAMS ---
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
  // -----------------------

  getEligibility(studentId: string, assessmentId: string) {
    // Atualizado para ler o status da tentativa mais recente na nova tabela de snapshots
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

      // Mapeia o snapshot para a interface esperada pelo UI
      return {
        id: snap.id,
        id_avaliacao: snap.id_avaliacao_original,
        id_aluno: snap.id_aluno,
        nota_final: snap.nota_obtida || 0,
        aprovado: snap.status_aprovacao ?? true, // se não finalizou ainda, permite
        data_inicio: snap.data_aplicacao,
        data_fim: snap.status_aprovacao !== undefined ? new Date().toISOString() : undefined,
        reprovas_por_area: snap.areas_reprovadas
      } as StudentAssessment;
    }));
  }
}