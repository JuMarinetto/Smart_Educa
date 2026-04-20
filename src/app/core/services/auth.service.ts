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
   * ⚠️  SEGURANÇA: A senha NÃO é salva no localStorage.
   * TODO: Migrar para Supabase Auth nativo com bcrypt para eliminar
   *       o armazenamento de senhas em texto puro no banco.
   */
  async loginByEmail(email: string, senha: string): Promise<Profile | null> {
    console.log('[Auth] Tentando login para:', email.trim().toLowerCase());

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('senha', senha)
      .eq('ativo', true)
      .single();

    if (error) {
      // Log detalhado para diagnóstico — remover após corrigir
      console.error('[Auth] Erro Supabase:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    if (!data) {
      console.warn('[Auth] Nenhum perfil encontrado para as credenciais fornecidas.');
      return null;
    }

    // ✅ SEGURANÇA: Remove a senha antes de persistir no storage
    const { senha: _senha, ...safeProfile } = data as any;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeProfile));
    console.log('[Auth] Login bem-sucedido, perfil:', safeProfile.perfil);
    return safeProfile as Profile;
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
