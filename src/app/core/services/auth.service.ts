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

  private readonly STORAGE_KEY = 'smarteduca_profile';

  /** 
   * Tenta realizar o login localizando um perfil por e-mail no banco de dados.
   * Retorna o perfil se encontrado e ativo, ou null em caso de erro/inativo.
   * 
   * OBS: Atualmente a senha é comparada em texto puro diretamente na query.
   * Recomendação futura: Implementar hashing (BCrypt) via Edge Functions ou Auth do Supabase.
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
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
    return profile;
  }

  /** Retorna o perfil atualmente logado a partir do localStorage. */
  getLoggedProfile(): Profile | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return null;
    }
  }

  /**
   * Retorna a string de papel simplificada para uso em Guards.
   * Agrupa ADMIN, PROFESSOR e GERENTE como 'admin' e o restante como 'student'.
   */
  getRole(): 'admin' | 'student' | null {
    const profile = this.getLoggedProfile();
    if (!profile) return null;

    const adminProfiles = ['ADMIN', 'PROFESSOR', 'GERENTE'];
    if (adminProfiles.includes(profile.perfil)) {
      return 'admin';
    }
    return 'student';
  }

  /** Verifica se existe uma sessão ativa (baseada em localStorage). */
  isLoggedIn(): boolean {
    return !!this.getLoggedProfile();
  }

  /** Limpa o perfil do armazenamento e redireciona para a tela de login. */
  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  /** Redireciona o usuário para o dashboard apropriado ao seu papel. */
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
