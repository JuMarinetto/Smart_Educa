import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Profile } from '../models/profile.model';
import { from, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private supabase = inject(SupabaseService).client;

    getProfiles() {
        return from(
            this.supabase
                .from('profiles')
                .select('*')
                .order('nome')
        ).pipe(map(res => (res.data as Profile[]) || []));
    }

    getProfileById(id: string) {
        return from(
            this.supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()
        ).pipe(map(res => res.data as Profile));
    }

    async updateProfile(id: string, profile: Partial<Profile>) {
        return await this.supabase
            .from('profiles')
            .update(profile)
            .eq('id', id);
    }

    async createProfile(profile: Partial<Profile>) {
        // Generate an ID if one isn't provided (assuming we aren't enforcing 1:1 with auth.users yet)
        if (!profile.id) {
            profile.id = crypto.randomUUID();
        }
        return await this.supabase
            .from('profiles')
            .insert(profile);
    }

    async deleteProfile(id: string) {
        // 1. Remove student associations
        await this.supabase.from('class_students').delete().eq('id_aluno', id);
        await this.supabase.from('assessment_snapshots').delete().eq('id_aluno', id);
        await this.supabase.from('student_progress').delete().eq('id_aluno', id);
        await this.supabase.from('certificates').delete().eq('id_aluno', id);

        // 2. Unlink if it's a professor (don't delete the course/class, just remove the link)
        await this.supabase.from('courses').update({ id_professor: null }).eq('id_professor', id);
        await this.supabase.from('classes').update({ id_professor: null }).eq('id_professor', id);

        // 3. Remove the profile itself
        return await this.supabase
            .from('profiles')
            .delete()
            .eq('id', id);
    }
}
