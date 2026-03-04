import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { LocationService, State, City } from '../../core/services/location.service';
import { validatePasswordComplexity } from '../../core/utils/password-validator';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxMaskDirective, NgxMaskPipe, LucideAngularModule, UiCardComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <h1>Configurações</h1>
        <p>Gerencie sua conta e preferências da plataforma.</p>
      </header>

      <div class="settings-grid">
        <app-ui-card>
          <h3>Perfil do Usuário</h3>
          <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="form-group">
              <label>Nome Completo</label>
              <input type="text" formControlName="nome">
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
                <input type="text" formControlName="cep" mask="00000-000">
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

            <button type="submit" class="btn-save" [disabled]="profileForm.invalid">Salvar Alterações</button>
          </form>
        </app-ui-card>

        <app-ui-card class="mt-2">
          <h3>Segurança</h3>
          <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()">
            <div class="form-group">
              <label>Nova Senha</label>
              <input type="password" formControlName="password">
              <div class="password-hints" *ngIf="passwordForm.get('password')?.value">
                <span [class.valid]="hasUpper">ABC</span>
                <span [class.valid]="hasLower">abc</span>
                <span [class.valid]="hasNumber">123</span>
                <span [class.valid]="hasSpecial">!@#</span>
                <span [class.valid]="isLongEnough">8+</span>
              </div>
            </div>
            <button type="submit" class="btn-save" [disabled]="passwordForm.invalid">Atualizar Senha</button>
          </form>
        </app-ui-card>

        <app-ui-card class="mt-2" *ngIf="isAdmin">
          <div class="mfa-header">
            <lucide-icon name="Shield" size="24"></lucide-icon>
            <h3>Autenticação de Dois Fatores (2FA)</h3>
          </div>
          <p class="mfa-desc">Como administrador, o 2FA é obrigatório para garantir a segurança da sua conta.</p>
          <button class="btn-mfa">
            <lucide-icon name="Smartphone" size="18"></lucide-icon>
            Configurar 2FA
          </button>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { margin-bottom: 2rem; }
    .settings-grid { max-width: 800px; }
    .mt-2 { margin-top: 2rem; }
    h3 { margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.2rem; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .form-row { display: flex; gap: 1rem; margin-bottom: 1.2rem; }
    label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    input, select { padding: 0.8rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); width: 100%; }
    .btn-save { margin-top: 1rem; padding: 0.8rem; background: var(--primary); color: white; border-radius: 8px; font-weight: 600; width: 100%; }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .password-hints { display: flex; gap: 10px; margin-top: 8px; font-size: 0.75rem; font-weight: 700; }
    .password-hints span { color: var(--text-muted); padding: 2px 6px; border-radius: 4px; background: var(--border); }
    .password-hints span.valid { background: rgba(16, 185, 129, 0.1); color: var(--success); }

    .mfa-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; color: var(--primary); }
    .mfa-desc { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
    .btn-mfa { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 0.8rem; border: 1px solid var(--primary); color: var(--primary); border-radius: 8px; font-weight: 600; width: 100%; background: transparent; }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  states: State[] = [];
  cities: City[] = [];
  isAdmin = true;

  constructor() {
    this.profileForm = this.fb.group({
      nome: ['', Validators.required],
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
  }

  onStateChange() {
    const stateSigla = this.profileForm.get('estado')?.value;
    this.cities = [];
    this.profileForm.patchValue({ cidade: '' });
    if (stateSigla) {
      this.locationService.getCities(stateSigla).subscribe(data => this.cities = data);
    }
  }

  passwordComplexityValidator(control: any) {
    if (!control.value) return null;
    return validatePasswordComplexity(control.value) ? null : { complexity: true };
  }

  get hasUpper() { return /[A-Z]/.test(this.passwordForm.get('password')?.value || ''); }
  get hasLower() { return /[a-z]/.test(this.passwordForm.get('password')?.value || ''); }
  get hasNumber() { return /[0-9]/.test(this.passwordForm.get('password')?.value || ''); }
  get hasSpecial() { return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordForm.get('password')?.value || ''); }
  get isLongEnough() { return (this.passwordForm.get('password')?.value || '').length >= 8; }

  saveProfile() {
    console.log('Salvando perfil...', this.profileForm.value);
  }

  updatePassword() {
    console.log('Atualizando senha...', this.passwordForm.value);
  }
}