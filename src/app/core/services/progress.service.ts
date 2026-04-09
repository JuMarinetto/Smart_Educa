import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StudentProgress } from '../models/progress.model';
import { from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private supabase = inject(SupabaseService).client;

  /** Busca o progresso de um aluno em um conteúdo específico. */
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

  /** Retorna todos os certificados de um aluno, ordenados do mais recente. */
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

  /**
   * Verifica se o aluno concluiu 100% dos conteúdos do curso.
   * Se sim, emite o certificado automaticamente (idempotente — não duplica).
   */
  async checkAndIssueCertificate(studentId: string, courseId: string): Promise<boolean> {
    if (!courseId || !studentId) return false;

    // Verifica se o certificado já foi emitido
    const { data: existingCerts } = await this.supabase
      .from('certificates')
      .select('id')
      .eq('id_aluno', studentId)
      .eq('id_curso', courseId);

    if (existingCerts && existingCerts.length > 0) return true;

    // Coleta os IDs de todos os conteúdos do curso
    const allContentIds = await this._collectContentIds(courseId);
    if (allContentIds.length === 0) return false;

    // Verifica quantos conteúdos foram concluídos
    const { data: progress } = await this.supabase
      .from('student_progress')
      .select('id_conteudo, status')
      .eq('id_aluno', studentId)
      .in('id_conteudo', allContentIds)
      .eq('status', 'CONCLUIDO');

    const concluiuTudo = (progress?.length || 0) === allContentIds.length;

    if (concluiuTudo) {
      const code = this._generateCertificateCode();
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

  /** Retorna o progresso de um aluno para uma lista de conteúdos. */
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

  /**
   * Atualiza o progresso do aluno via UPSERT.
   * Requer constraint UNIQUE(id_aluno, id_conteudo) no banco.
   * Em caso de erro de constraint, usa fallback de SELECT + INSERT/UPDATE.
   */
  async updateProgress(progress: Partial<StudentProgress>) {
    const now = new Date().toISOString();
    const payload = {
      id_aluno:                 progress.id_aluno,
      id_conteudo:              progress.id_conteudo,
      status:                   progress.status,
      porcentagem_concluida:    progress.porcentagem_concluida ?? 100,
      data_ultima_visualizacao: now,
      ...(progress.status === 'CONCLUIDO' ? { data_conclusao: now } : {})
    };

    const res = await this.supabase
      .from('student_progress')
      .upsert(payload, { onConflict: 'id_aluno,id_conteudo', ignoreDuplicates: false });

    // Fallback para quando a constraint UNIQUE ainda não existe no banco
    if (res.error && (res.error.code === '42P10' || res.error.code === '23000')) {
      console.warn('UPSERT fallback: constraint UNIQUE ausente, usando SELECT + write');
      return this._updateProgressFallback(progress, now);
    }

    if (res.error) console.error('Erro ao atualizar progresso:', res.error);
    return res;
  }

  /** Verifica se todos os conteúdos de um tópico foram concluídos pelo aluno. */
  async checkModuleCompletion(studentId: string, topicId: string): Promise<boolean> {
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

  // ─── Métodos privados ────────────────────────────────────────────────────────

  /** Coleta os IDs de todos os conteúdos vinculados a um curso. */
  private async _collectContentIds(courseId: string): Promise<string[]> {
    const { data: topics } = await this.supabase
      .from('topics')
      .select(`
        id,
        course_contents ( id_conteudo, tipo )
      `)
      .eq('id_curso', courseId);

    if (!topics) return [];

    return topics.flatMap((t: any) =>
      (t.course_contents || [])
        .filter((c: any) => (!c.tipo || c.tipo === 'conteudo') && c.id_conteudo)
        .map((c: any) => c.id_conteudo as string)
    );
  }

  /**
   * Gera um código de verificação criptograficamente seguro para certificados.
   * Usa crypto.getRandomValues() em vez de Math.random().
   */
  private _generateCertificateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    const prefix = Array.from(randomBytes)
      .map(b => chars[b % chars.length])
      .join('');
    return `${prefix}-${Date.now().toString().slice(-4)}`;
  }

  /** Fallback: SELECT + INSERT/UPDATE para quando o UPSERT não está disponível. */
  private async _updateProgressFallback(progress: Partial<StudentProgress>, now: string) {
    const { data: existing, error: fetchErr } = await this.supabase
      .from('student_progress')
      .select('id')
      .eq('id_aluno', progress.id_aluno)
      .eq('id_conteudo', progress.id_conteudo)
      .maybeSingle();

    if (fetchErr) console.error('Erro ao buscar progresso existente:', fetchErr);

    if (existing) {
      const res = await this.supabase
        .from('student_progress')
        .update({
          ...progress,
          data_ultima_visualizacao: now,
          ...(progress.status === 'CONCLUIDO' ? { data_conclusao: now } : {})
        })
        .eq('id', existing.id);
      if (res.error) console.error('Erro ao atualizar progresso:', res.error);
      return res;
    }

    const res = await this.supabase
      .from('student_progress')
      .insert({
        ...progress,
        data_primeiro_acesso: now,
        data_ultima_visualizacao: now
      });
    if (res.error) console.error('Erro ao inserir progresso:', res.error);
    return res;
  }
}