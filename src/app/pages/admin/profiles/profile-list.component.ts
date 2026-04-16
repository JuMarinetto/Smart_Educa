import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ProfileService } from '../../../core/services/profile.service';
import { Profile, UserRole } from '../../../core/models/profile.model';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DataTableComponent, UiModalComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Gestão de Perfis</h1>
          <p>Administre os usuários e permissões da plataforma.</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <lucide-icon name="Plus" size="18"></lucide-icon>
          Novo Usuário
        </button>
      </header>

      <app-data-table 
        [title]="'Lista de Usuários'"
        [columns]="columns"
        [data]="profiles"
        (edit)="openModal($event)"
        (delete)="confirmDelete($event)">
      </app-data-table>

      <app-ui-modal title="Confirmar Exclusão" [(isOpen)]="isDeleteModalOpen" width="450px">
        <div class="modal-body" *ngIf="profileToDelete">
          <p>Tem certeza que deseja excluir o perfil de <strong>{{ profileToDelete.nome }}</strong>?</p>
          <p style="font-size: 0.85rem; color: var(--danger); margin-top: 10px;">Esta ação não poderá ser desfeita.</p>
          <div class="form-actions" style="margin-top: 2rem;">
            <button type="button" class="btn-secondary" (click)="cancelDelete()">Cancelar</button>
            <button type="button" class="btn-danger" (click)="executeDelete()">Sim, Excluir Perfil</button>
          </div>
        </div>
      </app-ui-modal>

      <app-ui-modal [title]="editingProfile ? 'Editar Perfil' : 'Novo Perfil'" [(isOpen)]="isModalOpen" width="700px">
        <form (submit)="saveProfile($event)" class="admin-form">
          <div class="form-alert form-alert-error" *ngIf="showError">
            <lucide-icon name="AlertCircle" size="18"></lucide-icon>
            Preencha todos os campos obrigatórios (*) para continuar.
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Nome Completo <span class="required-star">*</span></label>
              <input type="text" [(ngModel)]="profileForm.nome" name="nome" required 
                     [class.invalid-input]="showError && !profileForm.nome"
                     placeholder="João Silva">
              <small class="error-hint" *ngIf="showError && !profileForm.nome">O nome é obrigatório.</small>
            </div>
            <div class="form-group width-200">
              <label>Perfil de Acesso <span class="required-star">*</span></label>
              <select [(ngModel)]="profileForm.perfil" name="perfil" required 
                      [class.invalid-input]="showError && !profileForm.perfil">
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor</option>
                <option value="GERENTE">Gerente</option>
                <option value="ADMIN">Administrador</option>
              </select>
              <small class="error-hint" *ngIf="showError && !profileForm.perfil">O perfil é obrigatório.</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>E-mail <span class="required-star">*</span></label>
              <input type="email" [(ngModel)]="profileForm.email" name="email" required 
                     [class.invalid-input]="showError && !profileForm.email"
                     placeholder="email@exemplo.com">
              <small class="error-hint" *ngIf="showError && !profileForm.email">O e-mail é obrigatório.</small>
            </div>
            <div class="form-group flex-1">
              <label>Senha <span class="required-star" *ngIf="!editingProfile">*</span></label>
              <input type="password" [(ngModel)]="profileForm.senha" name="senha" 
                     placeholder="Senha de acesso" [required]="!editingProfile">
              <small class="error-hint" *ngIf="showError && !editingProfile && !profileForm.senha">A senha é obrigatória para novos perfis.</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>CPF</label>
              <input type="text" [(ngModel)]="profileForm.cpf" (input)="formatCpf($event)" name="cpf" placeholder="000.000.000-00" maxlength="14">
            </div>
            <div class="form-group flex-1">
              <label>Telefone</label>
              <input type="text" [(ngModel)]="profileForm.telefone" (input)="formatPhone($event)" name="telefone" placeholder="(00) 00000-0000" maxlength="15">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Data de Nascimento</label>
              <input type="date" [(ngModel)]="profileForm.data_nascimento" name="data_nascimento">
            </div>
          </div>

          <div class="form-section">
            <h4>Endereço</h4>
            <div class="form-row">
              <div class="form-group width-120">
                <label>CEP</label>
                <input type="text" [(ngModel)]="profileForm.cep" (input)="formatCep($event)" name="cep" placeholder="00000-000" maxlength="9">
              </div>
              <div class="form-group flex-1">
                <label>Logradouro</label>
                <input type="text" [(ngModel)]="profileForm.endereco" name="endereco" placeholder="Rua, Av...">
              </div>
              <div class="form-group width-100">
                <label>Nº</label>
                <input type="text" [(ngModel)]="profileForm.numero" name="numero">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Cidade</label>
                <input type="text" [(ngModel)]="profileForm.cidade" name="cidade">
              </div>
              <div class="form-group width-100">
                <label>UF</label>
                <input type="text" [(ngModel)]="profileForm.estado" name="estado" maxlength="2">
              </div>
            </div>
          </div>

          <div class="form-group checkbox">
            <label>
              <input type="checkbox" [(ngModel)]="profileForm.ativo" name="ativo">
              Usuário Ativo
            </label>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">Salvar Alterações</button>
          </div>
        </form>
      </app-ui-modal>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-secondary { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; transition: background 0.2s; }
    .btn-secondary:hover { background: rgba(0,0,0,0.05); }
    .btn-danger { background: var(--danger); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-danger:hover { opacity: 0.9; }
    
    .admin-form { display: flex; flex-direction: column; gap: 1.2rem; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .width-200 { width: 200px; }
    .width-120 { width: 120px; }
    .width-100 { width: 100px; }
    
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    .form-group input, .form-group select { padding: 0.6rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); }
    .form-group.checkbox label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; }
    
    .form-section { border-top: 1px solid var(--border); pt: 1rem; margin-top: 0.5rem; }
    .form-section h4 { font-size: 0.9rem; margin-bottom: 1rem; color: var(--text-main); }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
  `]
})
export class ProfileListComponent implements OnInit {
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);
  profiles: Profile[] = [];

  isModalOpen = false;
  editingProfile: Profile | null = null;
  profileForm: Partial<Profile> = {
    nome: '',
    email: '',
    senha: '',
    perfil: 'ALUNO',
    ativo: true
  };
  showError = false;

  isDeleteModalOpen = false;
  profileToDelete: Profile | null = null;

  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome', type: 'text' },
    { key: 'email', label: 'E-mail', type: 'text' },
    { key: 'perfil', label: 'Perfil', type: 'text' },
    { key: 'ativo', label: 'Status', type: 'text' },
    { key: 'created_at', label: 'Criado em', type: 'date' }
  ];

  ngOnInit() {
    this.refresh();
  }

  // --- Formatadores de Máscara ---
  formatCpf(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    this.profileForm.cpf = value;
    event.target.value = value;
  }

  formatPhone(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');

    this.profileForm.telefone = value;
    event.target.value = value;
  }

  formatCep(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    value = value.replace(/^(\d{5})(\d)/, '$1-$2');

    this.profileForm.cep = value;
    event.target.value = value;
  }
  // -------------------------------

  refresh() {
    this.profileService.getProfiles().subscribe(data => {
      this.profiles = data;
    });
  }

  openModal(profile?: Profile) {
    this.showError = false;
    if (profile) {
      this.editingProfile = profile;
      this.profileForm = { ...profile, senha: '' }; // Don't show existing password
    } else {
      this.editingProfile = null;
      this.profileForm = {
        nome: '',
        email: '',
        senha: '',
        perfil: 'ALUNO',
        ativo: true
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.showError = false;
  }

  async saveProfile(event: Event) {
    event.preventDefault();
    this.showError = false;

    if (!this.profileForm.nome || !this.profileForm.email || !this.profileForm.perfil || (!this.editingProfile && !this.profileForm.senha)) {
      this.showError = true;
      return;
    }

    const payload: any = {
      nome: this.profileForm.nome,
      email: this.profileForm.email,
      perfil: this.profileForm.perfil,
      cpf: this.profileForm.cpf,
      telefone: this.profileForm.telefone,
      ativo: this.profileForm.ativo
    };

    // Only send password if it was entered
    if (this.profileForm.senha) {
      payload.senha = this.profileForm.senha;
    }

    try {
      const response = this.editingProfile
        ? await this.profileService.updateProfile(this.editingProfile.id, payload)
        : await this.profileService.createProfile(payload);

      if (response.error) {
        this.toastService.error('Erro ao salvar perfil: ' + (response.error as any).message);
        console.error(response.error);
      } else {
        this.toastService.success(this.editingProfile ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!');
        this.closeModal();
        this.refresh();
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      this.toastService.error('Erro inesperado ao salvar perfil.');
    }
  }

  confirmDelete(profile: Profile) {
    this.profileToDelete = profile;
    this.isDeleteModalOpen = true;
  }

  cancelDelete() {
    this.isDeleteModalOpen = false;
    this.profileToDelete = null;
  }

  async executeDelete() {
    if (!this.profileToDelete) return;

    try {
      const { error } = await this.profileService.deleteProfile(this.profileToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir: ' + (error as any).message);
      } else {
        this.toastService.success('Perfil excluído com sucesso!');
        this.refresh();
      }
    } catch (error: any) {
      console.error('Erro ao excluir perfil:', error);
      this.toastService.error('Erro ao excluir perfil.');
    } finally {
      this.cancelDelete();
    }
  }
}
