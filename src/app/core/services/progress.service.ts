import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StudentProgress, ProgressStatus } from '../models/progress.model';
import { from, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private supabase = inject(SupabaseService).client;

  /** Busca o progresso de um aluno em um conteúdo específico dentro de um curso. */
  getProgress(studentId: string, contentId: string, courseId: string): Observable<StudentProgress | null> {
    return from(
      this.supabase
        .from('student_progress')
        .select('*')
        .eq('id_aluno', studentId)
        .eq('id_conteudo', contentId)
        .eq('id_curso', courseId)
        .maybeSingle()
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
   * Verifica se o aluno concluiu 100% dos conteúdos do curso via RPC (Performance).
   */
  async checkAndIssueCertificate(studentId: string, courseId: string): Promise<boolean> {
    if (!courseId || !studentId) return false;

    try {
      const { data, error } = await this.supabase.rpc('check_and_issue_certificate', {
        p_student_id: studentId,
        p_course_id: courseId
      });

      if (error) {
        console.error('Erro ao verificar certificado via RPC:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Erro inesperado ao verificar certificado:', err);
      return false;
    }
  }

  /** Retorna o progresso de um aluno para uma lista de conteúdos em um curso específico. */
  getCourseProgress(studentId: string, contentIds: string[], courseId: string): Observable<StudentProgress[]> {
    if (!contentIds || contentIds.length === 0) return of([]);
    return from(
      this.supabase
        .from('student_progress')
        .select('*')
        .eq('id_aluno', studentId)
        .eq('id_curso', courseId)
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
      id_curso:                 progress.id_curso,
      status:                   progress.status,
      porcentagem_concluida:    progress.porcentagem_concluida ?? 100,
      data_ultima_visualizacao: now,
      ...(progress.status === 'CONCLUIDO' ? { data_conclusao: now } : {})
    };

    const res = await this.supabase
      .from('student_progress')
      .upsert(payload, { onConflict: 'id_aluno,id_conteudo,id_curso', ignoreDuplicates: false });

    // Fallback para quando a constraint UNIQUE ainda não existe no banco
    if (res.error && (res.error.code === '42P10' || res.error.code === '23000')) {
      console.warn('UPSERT fallback: constraint UNIQUE ausente ou incompatível, usando SELECT + write');
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
      .eq('id_curso', (await this.supabase.from('topics').select('id_curso').eq('id', topicId).single()).data?.id_curso) // Busca o curso do tópico
      .in('id_conteudo', contentIds)
      .eq('status', 'CONCLUIDO');

    return (progress?.length || 0) === contentIds.length;
  }
  /**
   * Marca todos os conteúdos de um curso como concluídos para um aluno.
   * Útil para o botão "Finalizar Curso".
   */
  async completeAllCourseContent(studentId: string, courseId: string): Promise<boolean> {
    console.log(`[ProgressService] Iniciando finalização total do curso: ${courseId} para aluno: ${studentId}`);
    if (!courseId || !studentId) {
      console.warn('[ProgressService] ID de curso ou aluno não fornecido.');
      return false;
    }

    try {
      // 1. Coleta todos os conteúdos do curso
      const allContentIds = await this._collectContentIds(courseId);
      console.log(`[ProgressService] Conteúdos coletados para finalizar: ${allContentIds.length}`, allContentIds);
      
      if (allContentIds.length === 0) {
        console.log('[ProgressService] Curso sem aulas detectado. Tentando emitir certificado direto.');
        return await this.checkAndIssueCertificate(studentId, courseId);
      }

      // Filtrar duplicatas e valores vazios por segurança
      const uniqueContentIds = [...new Set(allContentIds)].filter(id => !!id);
      console.log(`[ProgressService] IDs únicos após filtragem: ${uniqueContentIds.length}`);

      const now = new Date().toISOString();
      
      // 2. Prepara os payloads para upsert em lote
      const payloads = uniqueContentIds.map(id => ({
        id_aluno: studentId,
        id_conteudo: id,
        id_curso: courseId,
        status: 'CONCLUIDO' as ProgressStatus,
        porcentagem_concluida: 100,
        data_ultima_visualizacao: now,
        data_conclusao: now
      }));

      console.log(`[ProgressService] Enviando UPSERT em lote para ${payloads.length} registros...`);
      
      // 3. Executa o upsert
      const { error } = await this.supabase
        .from('student_progress')
        .upsert(payloads, { onConflict: 'id_aluno,id_conteudo,id_curso' });

      if (error) {
        console.error('[ProgressService] Erro fatal no UPSERT em lote:', error);
        // Tentativa de fallback: se falhar o lote, o checkAndIssueCertificate ainda pode tentar emitir o certificado
        // se o progresso já existia, mas o ideal é retornar erro para o usuário saber que o lote falhou.
        return false;
      }

      console.log('[ProgressService] UPSERT em lote concluído com sucesso.');

      // 4. Emite o certificado
      return await this.checkAndIssueCertificate(studentId, courseId);
    } catch (err) {
      console.error('[ProgressService] Exceção inesperada em completeAllCourseContent:', err);
      return false;
    }
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

  /** Fallback: SELECT + INSERT/UPDATE para quando o UPSERT não está disponível ou id_curso é opcional. */
  private async _updateProgressFallback(progress: Partial<StudentProgress>, now: string) {
    const { data: existing, error: fetchErr } = await this.supabase
      .from('student_progress')
      .select('id')
      .eq('id_aluno', progress.id_aluno)
      .eq('id_conteudo', progress.id_conteudo)
      .eq('id_curso', progress.id_curso)
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