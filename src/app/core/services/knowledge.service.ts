import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { KnowledgeArea } from '../models/knowledge-area.model';
import { Content } from '../models/content.model';
import { from, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  getAreas(rootPath?: string) {
    let query = this.supabase
      .from('knowledge_areas')
      .select('*');

    if (rootPath) {
      // Use ltree operator <@ (is descendant of): path <@ rootPath
      query = query.filter('path', 'cs', rootPath);
    }

    return from(
      query.order('path')
    ).pipe(map(res => (res.data as any[]) || []));
  }

  getContentsByArea(areaId: string) {
    if (areaId) {
      return from(
        this.supabase.from('knowledge_areas').select('path').eq('id', areaId).single()
      ).pipe(
        switchMap(res => {
          if (res.error) {
            console.error('Error fetching area path:', res.error);
            throw res.error;
          }
          const path = res.data?.path;
          if (path) {
            // Use 'cs' (contains) for ltree descendant check: path <@ area_path
            return from(this.supabase
              .from('contents')
              .select('*, knowledge_areas!inner(path)')
              .eq('is_latest', true)
              .filter('knowledge_areas.path', 'cs', path)
            );
          }
          return from(this.supabase
            .from('contents')
            .select('*, knowledge_areas!inner(path)')
            .eq('is_latest', true)
          );
        }),
        map((res: any) => {
          if (res.error) {
            console.error('Error fetching contents by area:', res.error);
            return [];
          }
          return (res.data as Content[]) || [];
        })
      );
    }

    return from(
      this.supabase
        .from('contents')
        .select('*, knowledge_areas(path)')
        .eq('is_latest', true)
    ).pipe(
      map(res => {
        if (res.error) {
          console.error('Error fetching all contents:', res.error);
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
    return await this.supabase.from('knowledge_areas').delete().eq('id', id);
  }

  // Content Management
  async createContent(content: Partial<Content>) {
    return await this.supabase.from('contents').insert(content);
  }

  async updateContent(id: string, content: Partial<Content>) {
    return await this.supabase.from('contents').update(content).eq('id', id);
  }

  async deleteContent(id: string) {
    return await this.supabase.from('contents').delete().eq('id', id);
  }
}