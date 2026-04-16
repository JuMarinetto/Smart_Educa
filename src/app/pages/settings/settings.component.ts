import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { LocationService, State, City } from '../../core/services/location.service';
import { validatePasswordComplexity } from '../../core/utils/password-validator';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { BrandingService, BrandingConfig } from '../../core/services/branding.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxMaskDirective, NgxMaskPipe, LucideAngularModule, UiCardComponent],
  template: `
    <div class="settings-container">
      <aside class="settings-sidebar">
        <header class="sidebar-header">
          <h1>Configurações</h1>
          <p>Gerencie sua experiência</p>
        </header>
        
        <nav class="settings-nav">
          <button (click)="activeTab = 'profile'" [class.active]="activeTab === 'profile'">
            <lucide-icon name="User" size="18"></lucide-icon>
            Perfil
          </button>
          <button (click)="activeTab = 'security'" [class.active]="activeTab === 'security'">
            <lucide-icon name="Lock" size="18"></lucide-icon>
            Segurança
          </button>
          <button *ngIf="isAdmin" (click)="activeTab = 'layout'" [class.active]="activeTab === 'layout'">
            <lucide-icon name="Palette" size="18"></lucide-icon>
            Layout do Sistema
          </button>
        </nav>
      </aside>

      <main class="settings-main">
        <!-- PERFIL -->
        <div class="tab-content" *ngIf="activeTab === 'profile'">
          <h2>Perfil do Usuário</h2>
          <app-ui-card>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
              <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" formControlName="nome">
              </div>

              <div class="form-group">
                  <label>E-mail</label>
                  <input type="email" formControlName="email">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>CPF</label>
                  <input type="text" formControlName="cpf" mask="000.000.000-00">
                </div>
                <div class="form-group">
                  <label>Telefone</label>
                  <input type="text" formControlName="telefone" mask="(00) 00000-0000">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>CEP</label>
                  <input type="text" formControlName="cep" mask="00000-000" (blur)="searchCep()">
                </div>
                <div class="form-group">
                  <label>Estado</label>
                  <select formControlName="estado" (change)="onStateChange()">
                    <option value="">Selecione</option>
                    <option *ngFor="let state of states" [value]="state.sigla">{{state.nome}}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Cidade</label>
                  <select formControlName="cidade">
                    <option value="">Selecione</option>
                    <option *ngFor="let city of cities" [value]="city.nome">{{city.nome}}</option>
                  </select>
                </div>
              </div>

              <button type="submit" class="btn-save" [disabled]="profileForm.invalid || isSavingProfile">
                {{ isSavingProfile ? 'Salvando...' : 'Salvar Alterações' }}
              </button>
            </form>
          </app-ui-card>
        </div>

        <!-- SEGURANÇA -->
        <div class="tab-content" *ngIf="activeTab === 'security'">
          <h2>Segurança da Conta</h2>
          <app-ui-card>
            <h3>Alterar Senha</h3>
            <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
              <div class="form-group">
                <label>Nova Senha</label>
                <input type="password" formControlName="password">
                <div class="password-hints" *ngIf="passwordForm.get('password')?.value">
                  <span [class.valid]="hasUpper">ABC</span>
                  <span [class.valid]="hasLower">abc</span>
                  <span [class.valid]="hasNumber">123</span>
                  <span [class.valid]="hasSpecial">!&#64;#</span>
                  <span [class.valid]="isLongEnough">8+</span>
                </div>
              </div>
              <button type="submit" class="btn-save" [disabled]="passwordForm.invalid || isUpdatingPassword">
                {{ isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha' }}
              </button>
            </form>
          </app-ui-card>
        </div>

        <!-- LAYOUT (ADMIN ONLY) -->
        <div class="tab-content" *ngIf="activeTab === 'layout' && isAdmin">
          <h2>Personalização do Sistema</h2>
          <p class="subtitle">As alterações feitas aqui afetam todos os usuários da plataforma.</p>
          
          <div class="layout-grid">
            <!-- Coluna de Controles -->
            <div class="layout-controls">
              <app-ui-card>
                <h3>1. Identidade Principal</h3>
                <div class="form-group">
                  <label>Nome da Escola</label>
                  <input type="text" [(ngModel)]="brandingConfig.school_name">
                </div>
                
                <div class="form-group">
                  <label>Logotipo (URL)</label>
                  <input type="text" [(ngModel)]="brandingConfig.logo_url" placeholder="https://exemplo.com/logo.png">
                </div>

                <h3 class="mt-2">2. Esqueema de Cores</h3>
                <div class="colors-controls">
                  <div class="color-control-item">
                    <label>Cor Primária</label>
                    <div class="color-picker-row">
                      <input type="color" [(ngModel)]="brandingConfig.primary_color" class="picker">
                      <input type="text" [(ngModel)]="brandingConfig.primary_color" class="hex">
                    </div>
                  </div>
                  <div class="color-control-item">
                    <label>Fundo do Sistema</label>
                    <div class="color-picker-row">
                      <input type="color" [(ngModel)]="brandingConfig.bg_color" class="picker">
                      <input type="text" [(ngModel)]="brandingConfig.bg_color" class="hex">
                    </div>
                  </div>
                  <div class="color-control-item">
                    <label>Fundo dos Cards</label>
                    <div class="color-picker-row">
                      <input type="color" [(ngModel)]="brandingConfig.card_color" class="picker">
                      <input type="text" [(ngModel)]="brandingConfig.card_color" class="hex">
                    </div>
                  </div>
                  <div class="color-control-item">
                    <label>Cor do Texto</label>
                    <div class="color-picker-row">
                      <input type="color" [(ngModel)]="brandingConfig.text_color" class="picker">
                      <input type="text" [(ngModel)]="brandingConfig.text_color" class="hex">
                    </div>
                  </div>
                </div>

                <div class="branding-actions">
                  <button class="btn-save" (click)="saveBranding()" [disabled]="isSavingBranding">
                    <lucide-icon name="Check" size="18"></lucide-icon>
                    {{ isSavingBranding ? 'Salvando...' : 'Aplicar Branding Global' }}
                  </button>

                  <button class="btn-reset-branding" (click)="resetBranding()" [disabled]="isSavingBranding">
                    <lucide-icon name="RotateCcw" size="18"></lucide-icon>
                    Restaurar Padrões do Sistema
                  </button>
                </div>
              </app-ui-card>
            </div>

            <!-- Coluna de Preview (Live) -->
            <div class="layout-preview">
              <h3>Preview em Tempo Real</h3>
              <div class="mockup-container" 
                   [style.--p]="brandingConfig.primary_color"
                   [style.--bg]="brandingConfig.bg_color"
                   [style.--c]="brandingConfig.card_color"
                   [style.--t]="brandingConfig.text_color">
                
                <div class="mockup-app">
                  <aside class="mockup-sidebar">
                    <div class="mockup-logo">
                        <img [src]="brandingConfig.logo_url" onerror="this.src='assets/logo.png'">
                        <span>{{ brandingConfig.school_name }}</span>
                    </div>
                    <nav>
                        <div class="mockup-nav-item active"></div>
                        <div class="mockup-nav-item"></div>
                        <div class="mockup-nav-item"></div>
                    </nav>
                  </aside>
                  <main class="mockup-content">
                    <div class="mockup-header"></div>
                    <div class="mockup-card">
                        <div class="mockup-line title"></div>
                        <div class="mockup-line"></div>
                        <div class="mockup-line short"></div>
                        <div class="mockup-btn">Botão Exemplo</div>
                    </div>
                    <div class="mockup-grid">
                        <div class="mockup-card small"></div>
                        <div class="mockup-card small"></div>
                    </div>
                  </main>
                </div>
              </div>
              <p class="preview-hint">Este é um rascunho de como o sistema aparecerá para os usuários.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .settings-container { display: flex; min-height: calc(100vh - 4rem); background: var(--bg-main); margin-left: 280px; }
    
    .settings-sidebar { width: 300px; padding: 3rem 2rem; border-right: 1px solid var(--border); background: var(--bg-sidebar); }
    .sidebar-header h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main); }
    .sidebar-header p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2.5rem; }

    .settings-nav { display: flex; flex-direction: column; gap: 0.5rem; }
    .settings-nav button {
      display: flex; align-items: center; gap: 12px; padding: 0.85rem 1.2rem;
      border-radius: 12px; font-weight: 600; color: var(--text-muted);
      background: transparent; transition: all 0.2s; text-align: left;
    }
    .settings-nav button:hover { background: rgba(var(--primary-rgb), 0.05); color: var(--text-main); }
    .settings-nav button.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.25); }

    .settings-main { flex: 1; padding: 4rem; max-width: 1200px; }
    .tab-content h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 2rem; color: var(--text-main); }
    .subtitle { margin-top: -1.5rem; margin-bottom: 2rem; color: var(--text-muted); font-size: 0.95rem; }

    .layout-grid { display: grid; grid-template-columns: 400px 1fr; gap: 3rem; align-items: start; }
    
    .form-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 8px; }
    label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    input, select { padding: 0.9rem; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card); color: var(--text-main); width: 100%; }

    .colors-controls { display: grid; gap: 1rem; }
    .color-control-item { padding: 1rem; border: 1px solid var(--border); border-radius: 12px; }
    .color-picker-row { display: flex; gap: 12px; align-items: center; margin-top: 8px; }
    .picker { width: 44px; height: 44px; border: none; border-radius: 8px; cursor: pointer; background: transparent; padding: 0; }
    .hex { font-family: monospace; font-size: 0.8rem; text-transform: uppercase; }

    .btn-save { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 1rem; background: var(--primary); color: white; border-radius: 10px; font-weight: 700; width: 100%; transition: all 0.2s; }
    .btn-save:hover { filter: brightness(1.1); transform: translateY(-2px); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .branding-actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    
    .btn-reset-branding { 
      display: flex; align-items: center; justify-content: center; gap: 10px; 
      padding: 0.8rem; background: rgba(255,255,255,0.05); color: var(--text-muted); 
      border: 1px dashed var(--border); border-radius: 10px; font-weight: 600; 
      width: 100%; transition: all 0.2s; cursor: pointer;
    }
    .btn-reset-branding:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

    /* MOCKUP PREVIEW */
    .mockup-container { 
      background: #121212; padding: 20px; border-radius: 16px; 
      border: 1px solid var(--border); overflow: hidden;
      aspect-ratio: 16 / 10;
    }
    .mockup-app { 
      display: flex; height: 100%; width: 100%; border-radius: 8px; 
      overflow: hidden; background: var(--bg); color: var(--t);
      font-size: 10px;
    }
    .mockup-sidebar { width: 60px; background: var(--c); border-right: 1px solid rgba(255,255,255,0.05); padding: 10px; }
    .mockup-logo { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 20px; }
    .mockup-logo img { width: 24px; height: 24px; border-radius: 4px; object-fit: contain; }
    .mockup-logo span { font-weight: 800; transform: scale(0.7); text-align: center; color: var(--t); opacity: 0.8; }
    .mockup-nav-item { height: 12px; width: 100%; border-radius: 4px; background: var(--t); opacity: 0.1; margin-bottom: 8px; }
    .mockup-nav-item.active { background: var(--p); opacity: 1; }

    .mockup-content { flex: 1; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
    .mockup-header { height: 20px; width: 100%; background: var(--c); border-radius: 6px; }
    .mockup-card { background: var(--c); padding: 12px; border-radius: 10px; }
    .mockup-line { height: 6px; background: var(--t); opacity: 0.1; border-radius: 3px; margin-bottom: 6px; }
    .mockup-line.title { height: 10px; width: 60%; opacity: 0.2; margin-bottom: 12px; }
    .mockup-line.short { width: 40%; }
    .mockup-btn { background: var(--p); color: white; padding: 6px 12px; border-radius: 6px; display: inline-block; font-weight: 700; margin-top: 5px; transform: scale(0.8); transform-origin: left; }
    
    .mockup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .mockup-card.small { height: 60px; }

    .preview-hint { margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted); text-align: center; font-style: italic; }

    .password-hints { display: flex; gap: 10px; margin-top: 10px; font-size: 0.75rem; font-weight: 800; }
    .password-hints span { color: var(--text-muted); padding: 4px 8px; border-radius: 6px; background: var(--border); }
    .password-hints span.valid { background: rgba(16, 185, 129, 0.1); color: var(--success); }

    .mt-2 { margin-top: 1.5rem; }
    h3 { margin-bottom: 1.2rem; font-size: 1.1rem; color: var(--text-main); }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);
  private brandingService = inject(BrandingService);
  
  activeTab: 'profile' | 'security' | 'layout' = 'profile';
  profileForm: FormGroup;
  passwordForm: FormGroup;
  states: State[] = [];
  cities: City[] = [];
  isAdmin = false;
  
  isSavingProfile = false;
  isUpdatingPassword = false;
  isSavingBranding = false;

  brandingConfig: BrandingConfig = {
    id: 'global',
    primary_color: '#8b5cf6',
    bg_color: '#0f0a1e',
    card_color: '#1a1230',
    text_color: '#e8e4f0',
    border_radius: 12,
    logo_url: 'assets/logo.png',
    school_name: 'SmartEduca'
  };

  constructor() {
    this.profileForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required, Validators.minLength(11)]],
      telefone: ['', Validators.required],
      cep: ['', Validators.required],
      estado: ['', Validators.required],
      cidade: ['', Validators.required]
    });

    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, this.passwordComplexityValidator]]
    });
  }

  ngOnInit() {
    this.locationService.getStates().subscribe(data => this.states = data);
    this.loadProfile();
    this.brandingConfig = { ...this.brandingService.config() };
  }

  loadProfile() {
    const profile = this.authService.getLoggedProfile();
    if (profile) {
      this.profileForm.patchValue({
        nome: profile.nome,
        email: profile.email,
        cpf: profile.cpf,
        telefone: profile.telefone,
        cep: profile.cep,
        estado: profile.estado,
        cidade: profile.cidade
      });
      this.isAdmin = this.authService.getRole() === 'admin';
      
      if (profile.estado) {
        this.locationService.getCities(profile.estado).subscribe(data => this.cities = data);
      }
    }
  }

  onStateChange() {
    const stateSigla = this.profileForm.get('estado')?.value;
    this.cities = [];
    this.profileForm.patchValue({ cidade: '' });
    if (stateSigla) {
      this.locationService.getCities(stateSigla).subscribe(data => this.cities = data);
    }
  }

  searchCep() {}

  passwordComplexityValidator(control: any) {
    if (!control.value) return null;
    return validatePasswordComplexity(control.value) ? null : { complexity: true };
  }

  get hasUpper() { return /[A-Z]/.test(this.passwordForm.get('password')?.value || ''); }
  get hasLower() { return /[a-z]/.test(this.passwordForm.get('password')?.value || ''); }
  get hasNumber() { return /[0-9]/.test(this.passwordForm.get('password')?.value || ''); }
  get hasSpecial() { return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordForm.get('password')?.value || ''); }
  get isLongEnough() { return (this.passwordForm.get('password')?.value || '').length >= 8; }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    const profile = this.authService.getLoggedProfile();
    if (!profile) return;
    this.isSavingProfile = true;
    try {
      const { error } = await this.profileService.updateProfile(profile.id, this.profileForm.value);
      if (error) throw error;
      const { senha: _s, ...safeProfile } = { ...profile, ...this.profileForm.value } as any;
      localStorage.setItem('smarteduca_profile', JSON.stringify(safeProfile));
      this.toastService.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      this.toastService.error('Erro ao atualizar: ' + error.message);
    } finally {
      this.isSavingProfile = false;
    }
  }

  async updatePassword() {
    if (this.passwordForm.invalid) return;
    const profile = this.authService.getLoggedProfile();
    if (!profile) return;
    this.isUpdatingPassword = true;
    try {
      const { error } = await this.profileService.updateProfile(profile.id, { senha: this.passwordForm.get('password')?.value });
      if (error) throw error;
      this.toastService.success('Senha atualizada!');
      this.passwordForm.reset();
    } catch (error: any) {
      this.toastService.error('Erro: ' + error.message);
    } finally {
      this.isUpdatingPassword = false;
    }
  }

  async saveBranding() {
    this.isSavingBranding = true;
    try {
      const { error } = await this.brandingService.saveBranding(this.brandingConfig);
      if (error) throw error;
      this.toastService.success('Layout global atualizado!');
    } catch (error: any) {
      this.toastService.error('Erro: ' + error.message);
    } finally {
      this.isSavingBranding = false;
    }
  }

  async resetBranding() {
    if (!confirm('Tem certeza que deseja restaurar as cores e logo padrão do sistema?')) return;
    
    this.isSavingBranding = true;
    try {
      const { error } = await this.brandingService.resetBranding();
      if (error) throw error;
      
      // Atualiza o formulário local com os novos valores (padrão)
      this.brandingConfig = { ...this.brandingService.config() };
      
      this.toastService.success('Layout restaurado para o padrão!');
    } catch (error: any) {
      this.toastService.error('Erro ao restaurar: ' + error.message);
    } finally {
      this.isSavingBranding = false;
    }
  }
}