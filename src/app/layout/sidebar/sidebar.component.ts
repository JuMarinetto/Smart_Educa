import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/theme.service';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { Profile } from '../../core/models/profile.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, UiModalComponent],
  template: `
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="logo" routerLink="/admin/dashboard">
          <img src="assets/logo.png" alt="Logo" class="custom-logo" />
          <p class="brand-name">SmartEduca</p>
        </div>

        <nav class="nav-section">
          <p class="section-title">PRINCIPAL</p>
          <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active">
            <lucide-icon name="LayoutDashboard" size="18"></lucide-icon>
            <span>Dashboard</span>
          </a>
        </nav>

        <nav class="nav-section">
          <p class="section-title">ADMINISTRAÇÃO</p>
          <a class="nav-item" routerLink="/admin/contents" routerLinkActive="active">
            <lucide-icon name="FileText" size="18"></lucide-icon>
            <span>Biblioteca de Conteúdos</span>
          </a>
          <a class="nav-item" routerLink="/admin/assessments" routerLinkActive="active">
            <lucide-icon name="FileCheck" size="18"></lucide-icon>
            <span>Avaliações</span>
          </a>
          <a class="nav-item" routerLink="/admin/courses" routerLinkActive="active">
            <lucide-icon name="BookOpen" size="18"></lucide-icon>
            <span>Gestão de Cursos</span>
          </a>
          <a class="nav-item" routerLink="/admin/classes" routerLinkActive="active">
            <lucide-icon name="Users" size="18"></lucide-icon>
            <span>Gestão de Turmas</span>
          </a>
          <a class="nav-item" routerLink="/admin/profiles" routerLinkActive="active">
            <lucide-icon name="Settings" size="18"></lucide-icon>
            <span>Gestão de Perfis</span>
          </a>
          <a class="nav-item" routerLink="/admin/excel-import" routerLinkActive="active">
            <lucide-icon name="FileSpreadsheet" size="18"></lucide-icon>
            <span>Importar Excel</span>
          </a>
        </nav>

        <nav class="nav-section">
          <p class="section-title">RELATÓRIOS</p>
          <a class="nav-item" routerLink="/admin/reports/access-time" routerLinkActive="active">
            <lucide-icon name="Clock" size="18"></lucide-icon>
            <span>Acesso Temporal</span>
          </a>
          <a class="nav-item" routerLink="/admin/reports/content-accessed" routerLinkActive="active">
            <lucide-icon name="FileText" size="18"></lucide-icon>
            <span>Conteúdo Acessado</span>
          </a>
          <a class="nav-item" routerLink="/admin/reports/performance" routerLinkActive="active">
            <lucide-icon name="TrendingUp" size="18"></lucide-icon>
            <span>Rendimento Alunos</span>
          </a>
          <a class="nav-item" routerLink="/admin/reports/retake-indicators" routerLinkActive="active">
            <lucide-icon name="AlertCircle" size="18"></lucide-icon>
            <span>Alertas Refazimento</span>
          </a>
          <a class="nav-item" routerLink="/admin/reports/franchise-training" routerLinkActive="active">
            <lucide-icon name="Briefcase" size="18"></lucide-icon>
            <span>Treinamento Franquias</span>
          </a>
          <a class="nav-item" routerLink="/admin/reports/staff-capacity" routerLinkActive="active">
            <lucide-icon name="Users" size="18"></lucide-icon>
            <span>Capacitação Staff</span>
          </a>
        </nav>
      </div>

      <div class="sidebar-footer">
        <div class="admin-profile" (click)="openProfileModal()">
          <div class="admin-avatar">
            <span *ngIf="userInitials">{{ userInitials }}</span>
            <lucide-icon *ngIf="!userInitials" name="User" size="18"></lucide-icon>
          </div>
          <div class="admin-info">
            <span class="admin-name">{{ userProfile?.nome || 'Admin' }}</span>
            <span class="admin-role">{{ userProfile?.perfil || 'Administrador' }}</span>
          </div>
        </div>

        <a class="nav-item-footer" (click)="themeService.toggleTheme()">
          <lucide-icon [name]="themeService.currentTheme() === 'light' ? 'Moon' : 'Sun'" size="18"></lucide-icon>
          <span>Tema {{ themeService.currentTheme() === 'light' ? 'Escuro' : 'Claro' }}</span>
        </a>
        <a class="nav-item-footer" routerLink="/admin/settings" routerLinkActive="active">
          <lucide-icon name="Settings" size="18"></lucide-icon>
          <span>Configurações</span>
        </a>
      </div>

      <!-- Profile Modal -->
      <app-ui-modal [(isOpen)]="isProfileModalOpen" title="Meu Perfil" width="400px">
        <div class="profile-details" *ngIf="userProfile">
          <div class="p-avatar-large">
            {{ userInitials }}
          </div>
          <h3 class="p-name">{{ userProfile.nome }}</h3>
          <p class="p-email">{{ userProfile.email }}</p>
          
          <div class="p-info-grid">
            <div class="p-info-item">
              <lucide-icon name="Shield" size="14"></lucide-icon>
              <span>{{ userProfile.perfil }}</span>
            </div>
            <div class="p-info-item" *ngIf="userProfile.telefone">
              <lucide-icon name="Smartphone" size="14"></lucide-icon>
              <span>{{ userProfile.telefone }}</span>
            </div>
          </div>

          <div class="p-status" [class.active]="userProfile.ativo">
            <span class="status-dot"></span>
            {{ userProfile.ativo ? 'Conta Ativa' : 'Conta Inativa' }}
          </div>

          <button class="btn-logout-modal" (click)="logout()">
            <lucide-icon name="LogOut" size="18"></lucide-icon>
            Sair da Conta
          </button>
        </div>
      </app-ui-modal>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: 100vh;
      background: var(--bg-sidebar);
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem 0.75rem;
      position: fixed;
      left: 0; top: 0;
      z-index: 100;
      overflow-y: auto;
      border-right: 1px solid var(--border);
    }

    .sidebar-top { display: flex; flex-direction: column; }

    .logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 0.75rem;
      margin-bottom: 2rem;
      cursor: pointer;
      text-decoration: none;
      gap: 0.5rem;
    }
    .custom-logo {
      max-height: 48px;
      max-width: 100%;
      background-color: white;
      border-radius: 6px;
      padding: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .brand-name {
      font-size: 1.3rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
      line-height: 1;
    }

    .nav-section { margin-bottom: 1.25rem; }

    .section-title {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      padding: 0 0.75rem;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      color: var(--text-muted);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      margin-bottom: 2px;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
    }
    .nav-item:hover {
      background: rgba(139, 92, 246, 0.08);
      color: var(--text-main);
    }
    .nav-item.active {
      color: var(--primary);
      background: rgba(139, 92, 246, 0.15);
    }

    .sidebar-footer {
      border-top: 1px solid var(--border);
      padding-top: 0.75rem;
    }

    .admin-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.75rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      margin-bottom: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .admin-profile:hover {
      background: rgba(139, 92, 246, 0.08);
      border-color: rgba(139, 92, 246, 0.2);
    }
    .admin-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 0.95rem; flex-shrink: 0;
    }
    .admin-info { display: flex; flex-direction: column; overflow: hidden; }
    .admin-name { font-size: 0.9rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .admin-role { font-size: 0.75rem; color: var(--text-muted); }

    .nav-item-footer {
      display: flex; align-items: center; gap: 12px; padding: 0.6rem 0.75rem; border-radius: 10px; color: var(--text-muted); cursor: pointer; text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; margin-bottom: 2px;
    }
    .nav-item-footer:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }

    /* ====== PROFILE MODAL ====== */
    .profile-details { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .p-avatar-large { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #ec4899, #8b5cf6); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 800; margin-bottom: 1rem; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.25); }
    .p-name { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
    .p-email { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .p-info-grid { display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: center; flex-wrap: wrap; }
    .p-info-item { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; color: var(--text-muted); border: 1px solid var(--border); }
    .p-status { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; padding: 0.4rem 1rem; border-radius: 8px; margin-bottom: 2rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .p-status.active { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .btn-logout-modal { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 1rem; }
    .btn-logout-modal:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
  `]
})
export class SidebarComponent implements OnInit {
  themeService = inject(ThemeService);
  private authService = inject(AuthService);

  userProfile: Profile | null = null;
  userInitials = '';
  isProfileModalOpen = false;

  ngOnInit() {
    this.userProfile = this.authService.getLoggedProfile();
    if (this.userProfile?.nome) {
      const names = this.userProfile.nome.trim().split(' ').filter(n => n.length > 0);
      if (names.length >= 2) {
        this.userInitials = (names[0][0] + names[names.length - 1][0]).toUpperCase();
      } else if (names.length === 1) {
        this.userInitials = names[0].substring(0, 2).toUpperCase();
      }
    }
  }

  openProfileModal() {
    this.isProfileModalOpen = true;
  }

  logout() {
    this.authService.logout();
  }
}