import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Question, Alternative } from '../models/question.model';
import { from, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class QuestionService {
    private supabase = inject(SupabaseService).client;

    getQuestions() {
        return from(
            this.supabase
                .from('questions')
                .select(`
          *,
          alternatives (*)
        `)
                .order('created_at', { ascending: false })
        ).pipe(map(res => (res.data as any[]) || []));
    }

    getQuestionsByArea(areaId: string) {
        return from(
            this.supabase
                .from('questions')
                .select(`
          *,
          alternatives (*)
        `)
                .eq('id_area_conhecimento', areaId)
                .order('created_at', { ascending: false })
        ).pipe(map(res => (res.data as any[]) || []));
    }

    async createQuestion(question: Partial<Question>, alternatives: Partial<Alternative>[]) {
        const { data, error } = await this.supabase
            .from('questions')
            .insert(question)
            .select()
            .single();

        if (error) throw error;

        const alts = alternatives.map(a => ({
            texto: a.texto,
            is_correta: a.is_correta,
            id_questao: data.id
        }));
        await this.supabase.from('alternatives').insert(alts);

        return data;
    }

    async updateQuestion(id: string, question: Partial<Question>, alternatives: Partial<Alternative>[]) {
        const { error } = await this.supabase
            .from('questions')
            .update(question)
            .eq('id', id);

        if (error) throw error;

        // Simple approach: delete all and re-insert
        await this.supabase.from('alternatives').delete().eq('id_questao', id);

        const alts = alternatives.map(a => ({
            texto: a.texto,
            is_correta: a.is_correta,
            id_questao: id
        }));
        await this.supabase.from('alternatives').insert(alts);
    }

    async deleteQuestion(id: string) {
        // 1. Remove linked alternatives and assessment links
        await this.supabase.from('alternatives').delete().eq('id_questao', id);
        await this.supabase.from('assessment_questions').delete().eq('id_questao', id);

        // 2. Remove the question
        return await this.supabase.from('questions').delete().eq('id', id);
    }
}
