import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, UiCardComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <h1>Configurações</h1>
        <p>Gerencie sua conta e preferências da plataforma.</p>
      </header>

      <div class="settings-grid">
        <app-ui-card>
          <h3>Perfil do Usuário</h3>
          <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" value="Administrador Nexus">
          </div>
          <div class="form-group">
            <label>E-mail Corporativo</label>
            <input type="email" value="admin@nexuslms.com">
          </div>
          <button class="btn-save">Salvar Alterações</button>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { margin-bottom: 2rem; }
    .settings-grid { max-width: 600px; }
    h3 { margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    input { padding: 0.8rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); }
    .btn-save { margin-top: 1rem; padding: 0.8rem; background: var(--primary); color: white; border-radius: 8px; font-weight: 600; width: 100%; }
  `]
})
export class SettingsComponent {}