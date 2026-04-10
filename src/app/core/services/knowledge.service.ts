import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { KnowledgeArea } from '../models/knowledge-area.model';
import { Content } from '../models/content.model';
import { from, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private supabase = inject(SupabaseService).client;

  /** Retorna todas as áreas de conhecimento, opcionalmente filtradas por caminho raiz (ltree). */
  getAreas(rootPath?: string) {
    let query = this.supabase
      .from('knowledge_areas')
      .select('*');

    if (rootPath) {
      // Filtro ltree: cs = "contains" — retorna áreas que pertencem ao caminho raiz
      query = query.filter('path', 'cs', rootPath);
    }

    return from(
      query.order('path')
    ).pipe(map(res => (res.data as any[]) || []));
  }

  /** Retorna conteúdos de uma área de conhecimento específica (ou todos, se sem filtro). */
  getContentsByArea(areaId: string | null | undefined) {
    const baseQuery = this.supabase
      .from('contents')
      .select('*, knowledge_areas!inner(path)')
      .eq('is_latest', true);

    if (!areaId) {
      // Se não houver área especificada, retorna todos os conteúdos mais recentes
      return from(baseQuery).pipe(
        map((res: any) => {
          if (res.error) {
            console.error('Erro ao buscar todos os conteúdos:', res.error);
            return [];
          }
          return (res.data as Content[]) || [];
        })
      );
    }

    return from(
      this.supabase.from('knowledge_areas').select('path').eq('id', areaId).single()
    ).pipe(
      switchMap(res => {
        if (res.error) {
          console.error('Erro ao buscar caminho da área:', res.error);
          throw res.error;
        }

        const path = res.data?.path;
        
        // Aplica filtro de descendência ltree se o caminho estiver disponível
        if (path) {
          return from(baseQuery.filter('knowledge_areas.path', 'cs', path));
        }

        return from(baseQuery);
      }),
      map((res: any) => {
        if (res.error) {
          console.error('Erro ao buscar conteúdos por área:', res.error);
          return [];
        }
        return (res.data as Content[]) || [];
      })
    );
  }

  async createArea(area: Partial<KnowledgeArea>) {
    return await this.supabase.from('knowledge_areas').insert(area);
  }

  async updateArea(id: string, area: Partial<KnowledgeArea>) {
    return await this.supabase.from('knowledge_areas').update(area).eq('id', id);
  }

  async deleteArea(id: string) {
    // 1. Unlink or remove dependent contents and questions first
    // Note: This could be expanded to recursive sub-areas if needed
    await this.supabase.from('contents').delete().eq('id_area_conhecimento', id);
    await this.supabase.from('questions').delete().eq('id_area_conhecimento', id);

    // 2. Remove the area
    return await this.supabase.from('knowledge_areas').delete().eq('id', id);
  }

  // ─── Gestão de Conteúdos ────────────────────────────────────────────────────

  async createContent(content: Partial<Content>) {
    return await this.supabase.from('contents').insert(content);
  }

  async updateContent(id: string, content: Partial<Content>) {
    return await this.supabase.from('contents').update(content).eq('id', id);
  }

  async deleteContent(id: string) {
    // 1. Remove from courses structure first
    await this.supabase.from('course_contents').delete().eq('id_conteudo', id);
    await this.supabase.from('topics').delete().eq('id_conteudo', id);

    // 2. Remove the content
    return await this.supabase.from('contents').delete().eq('id', id);
  }
}