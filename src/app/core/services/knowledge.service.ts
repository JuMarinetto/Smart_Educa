import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { KnowledgeArea } from '../models/knowledge-area.model';
import { Content } from '../models/content.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private supabaseService = inject(SupabaseService);
  private supabase = this.supabaseService.client;

  getAreas() {
    return from(
      this.supabase
        .from('knowledge_areas')
        .select('*')
        .order('area_conhecimento')
    ).pipe(map(res => (res.data as KnowledgeArea[]) || []));
  }

  getContentsByArea(areaId: string) {
    const query = this.supabase
      .from('contents')
      .select('*')
      .eq('is_latest', true);
    
    if (areaId) {
      query.eq('id_area_conhecimento', areaId);
    }

    return from(query).pipe(map(res => (res.data as Content[]) || []));
  }

  async createArea(area: Partial<KnowledgeArea>) {
    return await this.supabase.from('knowledge_areas').insert(area);
  }
}