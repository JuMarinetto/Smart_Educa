import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';
import { Profile } from '../models/profile.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase = inject(SupabaseService).client;
    private router = inject(Router);

    private storageKey = 'escola_ia_profile';

    /**
     * Attempt login by looking up a profile by email in the database.
     * Returns the profile if found and active, null otherwise.
     */
    async loginByEmail(email: string, senha: string): Promise<Profile | null> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .eq('senha', senha)
            .eq('ativo', true)
            .single();

        if (error || !data) {
            return null;
        }

        const profile = data as Profile;
        localStorage.setItem(this.storageKey, JSON.stringify(profile));
        return profile;
    }

    /**
     * Get the currently logged-in profile from localStorage.
     */
    getLoggedProfile(): Profile | null {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as Profile;
        } catch {
            return null;
        }
    }

    /**
     * Get the role string used by guards ('admin' or 'student').
     */
    getRole(): 'admin' | 'student' | null {
        const profile = this.getLoggedProfile();
        if (!profile) return null;

        if (profile.perfil === 'ADMIN' || profile.perfil === 'PROFESSOR' || profile.perfil === 'GERENTE') {
            return 'admin';
        }
        return 'student';
    }

    /**
     * Check if user is logged in.
     */
    isLoggedIn(): boolean {
        return this.getLoggedProfile() !== null;
    }

    /**
     * Logout: clear stored profile and redirect to login.
     */
    logout() {
        localStorage.removeItem(this.storageKey);
        this.router.navigate(['/login']);
    }

    /**
     * Navigate user to their appropriate dashboard based on role.
     */
    navigateToDashboard() {
        const role = this.getRole();
        if (role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
        } else if (role === 'student') {
            this.router.navigate(['/student/dashboard']);
        } else {
            this.router.navigate(['/login']);
        }
    }
}
