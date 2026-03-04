import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StudentProgress } from '../models/progress.model';
import { from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private supabase = inject(SupabaseService).client;

  getProgress(studentId: string, contentId: string): Observable<StudentProgress | null> {
    return from(
      this.supabase
        .from('student_progress')
        .select('*')
        .eq('id_aluno', studentId)
        .eq('id_conteudo', contentId)
        .single()
    ).pipe(map(res => res.data as StudentProgress));
  }

  async updateProgress(progress: Partial<StudentProgress>) {
    const { data: existing } = await this.supabase
      .from('student_progress')
      .select('id')
      .eq('id_aluno', progress.id_aluno)
      .eq('id_conteudo', progress.id_conteudo)
      .single();

    if (existing) {
      return await this.supabase
        .from('student_progress')
        .update({
          ...progress,
          data_ultima_visualizacao: new Date().toISOString(),
          ...(progress.visualizado ? { data_conclusao: new Date().toISOString() } : {})
        })
        .eq('id', existing.id);
    } else {
      return await this.supabase
        .from('student_progress')
        .insert({
          ...progress,
          data_primeiro_acesso: new Date().toISOString(),
          data_ultima_visualizacao: new Date().toISOString()
        });
    }
  }

  async checkModuleCompletion(studentId: string, topicId: string): Promise<boolean> {
    // Busca todos os conteúdos do tópico e verifica se todos estão visualizados pelo aluno
    const { data: contents } = await this.supabase
      .from('course_contents')
      .select('id_conteudo')
      .eq('id_topico', topicId);

    if (!contents || contents.length === 0) return true;

    const contentIds = contents.map(c => c.id_conteudo);
    const { data: progress } = await this.supabase
      .from('student_progress')
      .select('id_conteudo, visualizado')
      .eq('id_aluno', studentId)
      .in('id_conteudo', contentIds)
      .eq('visualizado', true);

    return (progress?.length || 0) === contentIds.length;
  }
}