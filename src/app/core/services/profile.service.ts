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
        return await this.supabase
            .from('profiles')
            .delete()
            .eq('id', id);
    }
}
