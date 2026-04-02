import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="login-card">
      <div class="logo">
        <img src="assets/logo.png" alt="Logo" class="custom-logo" />
        <p class="brand-name">SmartEduca</p>
      </div>

      <h2>Bem-vindo(a)</h2>
      <p class="subtitle">Entre com suas credenciais para acessar a plataforma.</p>

      <div class="alert" *ngIf="errorMessage">
        <lucide-icon name="AlertCircle" size="16"></lucide-icon>
        {{ errorMessage }}
      </div>

      <form (ngSubmit)="onLogin()" class="login-form">
        <div class="input-group">
          <label for="email">E-mail</label>
          <div class="input-wrapper">
            <lucide-icon name="Mail" size="16"></lucide-icon>
            <input id="email" type="email" [(ngModel)]="email" name="email"
              placeholder="seuemail@exemplo.com" required [disabled]="isLoading" />
          </div>
        </div>
        <div class="input-group">
          <label for="senha">Senha</label>
          <div class="input-wrapper">
            <lucide-icon name="Lock" size="16"></lucide-icon>
            <input id="senha" type="password" [(ngModel)]="senha" name="senha"
              placeholder="Digite sua senha" required [disabled]="isLoading" />
          </div>
        </div>
        <button type="submit" class="btn-login" [disabled]="isLoading || !email.trim() || !senha.trim()">
          <lucide-icon *ngIf="!isLoading" name="LogIn" size="18"></lucide-icon>
          <div *ngIf="isLoading" class="spinner"></div>
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="divider"><span>Plataforma de ensino inteligente</span></div>
    </div>
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg-main); }
    .login-card { background: var(--bg-card); padding: 3rem; border-radius: 20px; box-shadow: var(--shadow-lg); width: 100%; max-width: 440px; text-align: center; border: 1px solid var(--border); }
    .logo { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 2rem; gap: 0.6rem; }
    .custom-logo { max-height: 80px; max-width: 100%; background-color: #ffffff; border-radius: 12px; padding: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .brand-name { font-size: 1.6rem; font-weight: 800; letter-spacing: 0.5px; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; line-height: 1; }
    h2 { color: var(--text-main); font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
    .subtitle { color: #8b82a8; font-size: 0.9rem; margin-bottom: 2rem; }
    .alert { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171; padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 500; text-align: left; }
    .login-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .input-group { text-align: left; }
    .input-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-wrapper { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 0 1rem; transition: all 0.2s ease; }
    .input-wrapper:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2); }
    .input-wrapper lucide-icon { color: var(--text-muted); flex-shrink: 0; }
    .input-wrapper input { flex: 1; background: transparent; border: none; color: var(--text-main); padding: 0.85rem 0; font-size: 0.95rem; outline: none; }
    .input-wrapper input:-webkit-autofill,
    .input-wrapper input:-webkit-autofill:hover,
    .input-wrapper input:-webkit-autofill:focus,
    .input-wrapper input:-webkit-autofill:active {
      transition: background-color 5000s ease-in-out 0s;
      -webkit-text-fill-color: var(--text-main) !important;
    }
    .input-wrapper input::placeholder { color: var(--text-muted); opacity: 0.5; }
    .btn-login { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 0.9rem; border-radius: 12px; border: none; font-weight: 700; font-size: 1rem; cursor: pointer; color: white; background: linear-gradient(135deg, var(--primary), #6366f1); transition: all 0.25s ease; }
    .btn-login:hover:not([disabled]) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(139, 92, 246, 0.35); }
    .btn-login[disabled] { opacity: 0.5; cursor: not-allowed; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; color: var(--text-muted); font-size: 0.8rem; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .register-hint { font-size: 0.82rem; color: var(--text-muted); line-height: 1.5; }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  errorMessage = '';
  isLoading = false;

  async ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.navigateToDashboard();
    }
  }

  async onLogin() {
    if (!this.email.trim() || !this.senha.trim()) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const profile = await this.authService.loginByEmail(this.email, this.senha);

      if (!profile) {
        this.errorMessage = 'E-mail ou senha incorretos. Verifique suas credenciais.';
        this.isLoading = false;
        return;
      }

      this.authService.navigateToDashboard();
    } catch (err: any) {
      // Show more specific error messages if they come from Supabase (like missing column)
      if (err?.message?.includes('could not find the')) {
        this.errorMessage = 'Erro no banco de dados. Verifique se a coluna "senha" foi criada no Supabase.';
      } else {
        this.errorMessage = 'Erro ao conectar. Tente novamente.';
      }
      this.isLoading = false;
      console.error('Login error:', err);
    }
  }
}
