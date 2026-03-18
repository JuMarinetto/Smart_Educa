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

  getStudentCertificates(studentId: string): Observable<any[]> {
    return from(
      this.supabase
        .from('certificates')
        .select(`
          *,
          courses (titulo)
        `)
        .eq('id_aluno', studentId)
        .order('data_emissao', { ascending: false })
    ).pipe(map(res => res.data || []));
  }

  async checkAndIssueCertificate(studentId: string, courseId: string): Promise<boolean> {
    if (!courseId || !studentId) return false;

    // Verify if already has certificate
    const { data: existingCerts } = await this.supabase
      .from('certificates')
      .select('id')
      .eq('id_aluno', studentId)
      .eq('id_curso', courseId);

    if (existingCerts && existingCerts.length > 0) return true;

    // Fetch course structure
    const { data: topics } = await this.supabase
      .from('topics')
      .select(`
        id,
        course_contents ( id_conteudo, tipo )
      `)
      .eq('id_curso', courseId);

    if (!topics) return false;

    let allContentIds: string[] = [];
    topics.forEach((t: any) => {
      if (t.course_contents) {
        t.course_contents.forEach((c: any) => {
          if ((!c.tipo || c.tipo === 'conteudo') && c.id_conteudo) {
            allContentIds.push(c.id_conteudo);
          }
        });
      }
    });

    if (allContentIds.length === 0) return false;

    // Fetch progress
    const { data: progress } = await this.supabase
      .from('student_progress')
      .select('id_conteudo, status')
      .eq('id_aluno', studentId)
      .in('id_conteudo', allContentIds)
      .eq('status', 'CONCLUIDO');

    const completedCount = progress ? progress.length : 0;
    const is100Percent = completedCount === allContentIds.length;

    if (is100Percent) {
      // Issue certificate
      const code = Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString().slice(-4);
      await this.supabase.from('certificates').insert({
        id_aluno: studentId,
        id_curso: courseId,
        codigo_verificacao: code,
        data_emissao: new Date().toISOString()
      });
      return true;
    }

    return false;
  }

  getCourseProgress(studentId: string, contentIds: string[]): Observable<StudentProgress[]> {
    if (!contentIds || contentIds.length === 0) return of([]);
    return from(
      this.supabase
        .from('student_progress')
        .select('*')
        .eq('id_aluno', studentId)
        .in('id_conteudo', contentIds)
    ).pipe(map(res => (res.data as StudentProgress[]) || []));
  }

  async updateProgress(progress: Partial<StudentProgress>) {
    const { data: existing, error: fetchErr } = await this.supabase
      .from('student_progress')
      .select('id')
      .eq('id_aluno', progress.id_aluno)
      .eq('id_conteudo', progress.id_conteudo)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching existing progress:', fetchErr);
    }

    if (existing) {
      const res = await this.supabase
        .from('student_progress')
        .update({
          ...progress,
          data_ultima_visualizacao: new Date().toISOString(),
          ...(progress.status === 'CONCLUIDO' ? { data_conclusao: new Date().toISOString() } : {})
        })
        .eq('id', existing.id);

      if (res.error) console.error('Error updating progress:', res.error);
      return res;
    } else {
      const res = await this.supabase
        .from('student_progress')
        .insert({
          ...progress,
          data_primeiro_acesso: new Date().toISOString(),
          data_ultima_visualizacao: new Date().toISOString()
        });

      if (res.error) console.error('Error inserting progress:', res.error);
      return res;
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
      .select('id_conteudo, status')
      .eq('id_aluno', studentId)
      .in('id_conteudo', contentIds)
      .eq('status', 'CONCLUIDO');

    return (progress?.length || 0) === contentIds.length;
  }
}