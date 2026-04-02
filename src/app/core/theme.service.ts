import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'smarteduca_theme';

  private theme = signal<'light' | 'dark'>(this._loadInitialTheme());

  /** Alterna entre tema claro e escuro, persistindo a preferência no localStorage. */
  toggleTheme() {
    const newTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(newTheme);
    this._applyTheme(newTheme);
  }

  get currentTheme() {
    return this.theme;
  }

  // ─── Privado ────────────────────────────────────────────────────────────────

  /**
   * Determina o tema inicial na seguinte ordem de prioridade:
   * 1. Preferência salva pelo usuário no localStorage
   * 2. Preferência do sistema operacional (prefers-color-scheme)
   * 3. Padrão: claro
   */
  private _loadInitialTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(this.STORAGE_KEY) as 'light' | 'dark' | null;
    if (saved === 'light' || saved === 'dark') {
      this._applyTheme(saved);
      return saved;
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial: 'light' | 'dark' = prefersDark ? 'dark' : 'light';
    this._applyTheme(initial);
    return initial;
  }

  /** Aplica o tema no elemento raiz do documento e persiste no localStorage. */
  private _applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }
}