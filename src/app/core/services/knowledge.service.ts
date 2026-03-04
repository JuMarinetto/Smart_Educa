import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { KnowledgeArea } from '../models/knowledge-area.model';
import { Content } from '../models/content.model';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private supabase = inject(SupabaseService).client;

  getAreas() {
    return from(
      this.supabase
        .from('knowledge_areas')
        .select('*')
        .order('area_conhecimento')
    ).pipe(map(res => res.data as KnowledgeArea[]));
  }

  getContentsByArea(areaId: string) {
    return from(
      this.supabase
        .from('contents')
        .select('*')
        .eq('id_area_conhecimento', areaId)
        .eq('is_latest', true)
    ).pipe(map(res => res.data as Content[]));
  }

  async createArea(area: Partial<KnowledgeArea>) {
    return await this.supabase.from('knowledge_areas').insert(area);
  }
}