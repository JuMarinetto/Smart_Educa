import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Assessment, StudentAssessment, AssessmentSnapshot } from '../models/assessment.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  private supabase = inject(SupabaseService).client;

  async startAssessment(assessmentId: string, studentId: string) {
    // 1. Registra início (para validação de tempo no backend)
    const { data: attempt } = await this.supabase
      .from('student_assessments')
      .insert({
        id_avaliacao: assessmentId,
        id_aluno: studentId,
        data_inicio: new Date().toISOString()
      })
      .select()
      .single();

    // 2. Cria Snapshots das questões atuais para garantir imutabilidade do histórico
    const { data: questions } = await this.supabase
      .from('questions')
      .select('*, alternatives(*)')
      .eq('id_avaliacao', assessmentId);

    if (questions && attempt) {
      const snapshots = questions.map(q => ({
        id_avaliacao_aluno: attempt.id,
        id_questao_original: q.id,
        enunciado: q.enunciado,
        area_conhecimento: q.id_area_conhecimento,
        alternativas: q.alternatives
      }));

      await this.supabase.from('assessment_snapshots').insert(snapshots);
    }

    return attempt;
  }

  async submitAssessment(attemptId: string, answers: any[]) {
    // Simulação de lógica de backend:
    // 1. Calcula nota total
    // 2. Agrupa por área e valida Nota_Por_Area >= Nota_Corte_Area
    // 3. Registra data_fim e calcula delta real
    return await this.supabase
      .from('student_assessments')
      .update({
        data_fim: new Date().toISOString(),
        // ... resultados calculados
      })
      .eq('id', attemptId);
  }

  getEligibility(studentId: string, assessmentId: string) {
    return from(
      this.supabase
        .from('student_assessments')
        .select('*')
        .eq('id_aluno', studentId)
        .eq('id_avaliacao', assessmentId)
        .order('data_inicio', { ascending: false })
        .limit(1)
    ).pipe(map(res => res.data?.[0] as StudentAssessment));
  }
}