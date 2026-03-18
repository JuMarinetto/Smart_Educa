import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { KnowledgeService } from '../../core/services/knowledge.service';
import { ThemeService } from '../../core/theme.service';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { Profile } from '../../core/models/profile.model';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, UiModalComponent],
  template: `
    <div class="student-app">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-top">
          <div class="logo" (click)="sidebarCollapsed = !sidebarCollapsed">
            <img src="assets/logo.png" alt="Logo" class="custom-logo" [class.collapsed-logo]="sidebarCollapsed" />
          </div>

          <div class="search-box" *ngIf="!sidebarCollapsed">
            <lucide-icon name="Search" size="14"></lucide-icon>
            <input type="text" placeholder="Buscar cursos..." [(ngModel)]="searchTerm">
          </div>

          <nav class="nav-main">
            <a class="nav-link" routerLink="/student/dashboard" routerLinkActive="active">
              <lucide-icon name="Home" size="20"></lucide-icon>
              <span *ngIf="!sidebarCollapsed">Início</span>
              <span class="badge" *ngIf="!sidebarCollapsed">Novo</span>
            </a>
            <a class="nav-link" routerLink="/student/catalog" routerLinkActive="active">
              <lucide-icon name="Compass" size="20"></lucide-icon>
              <span *ngIf="!sidebarCollapsed">Explorar</span>
            </a>
            <a class="nav-link" routerLink="/student/my-courses" routerLinkActive="active">
              <lucide-icon name="BookOpen" size="20"></lucide-icon>
              <span *ngIf="!sidebarCollapsed">Meus Cursos</span>
            </a>
            <a class="nav-link" routerLink="/student/assessments" routerLinkActive="active">
              <lucide-icon name="FileCheck" size="20"></lucide-icon>
              <span *ngIf="!sidebarCollapsed">Avaliações</span>
            </a>
            <a class="nav-link" routerLink="/student/certificates" routerLinkActive="active">
              <lucide-icon name="Award" size="20"></lucide-icon>
              <span *ngIf="!sidebarCollapsed">Meus Certificados</span>
            </a>
          </nav>

          <div class="categories" *ngIf="!sidebarCollapsed">
            <h4 class="section-label">Categorias</h4>
            <a class="nav-link category" *ngFor="let area of areas" [routerLink]="['/student/catalog']" [queryParams]="{area: area.id}">
              <lucide-icon name="Folder" size="16"></lucide-icon>
              <span>{{ area.area_conhecimento }}</span>
            </a>
          </div>
        </div>

        <div class="sidebar-bottom" *ngIf="!sidebarCollapsed">
          <a class="nav-link" (click)="logout()">
            <lucide-icon name="LogOut" size="20"></lucide-icon>
            <span>Sair</span>
          </a>
        </div>
      </aside>

      <!-- Top Navbar -->
      <div class="main-wrapper" [class.shifted]="!sidebarCollapsed">
        <header class="topbar">
          <nav class="topbar-nav">
            <a routerLink="/student/dashboard" routerLinkActive="active">Início</a>
            <a routerLink="/student/catalog" routerLinkActive="active">Explorar</a>
            <a routerLink="/student/my-courses" routerLinkActive="active">Meus Cursos</a>
          </nav>

          <div class="topbar-right">
            <div class="search-topbar">
              <lucide-icon name="Search" size="16"></lucide-icon>
              <input type="text" placeholder="Buscar cursos, aulas, conteúdos..." [(ngModel)]="searchTerm">
            </div>
            <button class="icon-btn" (click)="themeService.toggleTheme()">
              <lucide-icon [name]="themeService.currentTheme() === 'light' ? 'Moon' : 'Sun'" size="18"></lucide-icon>
            </button>
            <button class="icon-btn">
              <lucide-icon name="Bell" size="18"></lucide-icon>
            </button>
            <div class="avatar" (click)="openProfileModal()" [title]="userProfile?.nome || 'Perfil'">
              <span *ngIf="userInitials" class="avatar-initials">{{ userInitials }}</span>
              <lucide-icon *ngIf="!userInitials" name="User" size="18"></lucide-icon>
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet></router-outlet>
        </main>
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
    </div>
  `,
  styles: [`
    /* ====== THEME VARIABLES overrides ====== */
    :host {
      --st-bg: var(--bg-main);
      --st-bg-card: var(--bg-card);
      --st-bg-card-hover: rgba(139, 92, 246, 0.05);
      --st-sidebar: var(--bg-sidebar);
      --st-topbar: rgba(var(--bg-main), 0.85); /* we can use default bg-main here or inherit */
      --st-border: var(--border);
      --st-text: var(--text-main);
      --st-text-muted: var(--text-muted);
      --st-accent: var(--primary);
      --st-accent-glow: rgba(139, 92, 246, 0.3);
      --st-gradient-1: linear-gradient(135deg, #8b5cf6, #6366f1);
      --st-gradient-2: linear-gradient(135deg, #ec4899, #8b5cf6);
      --st-gradient-3: linear-gradient(135deg, #06b6d4, #8b5cf6);
      --st-radius: 12px;
      --st-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .topbar {
        background: var(--st-bg) !important;
    }

    /* ====== APP SHELL ====== */
    .student-app {
      display: flex;
      min-height: 100vh;
      background: var(--st-bg);
      color: var(--st-text);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* ====== SIDEBAR ====== */
    .sidebar {
      width: 240px;
      height: 100vh;
      position: fixed;
      left: 0; top: 0;
      z-index: 200;
      background: var(--st-sidebar);
      border-right: 1px solid var(--st-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem 0.75rem;
      overflow-y: auto;
      transition: width 0.25s ease;
    }
    .sidebar.collapsed { width: 64px; padding: 1.25rem 0.5rem; }
    .sidebar.collapsed .nav-link { justify-content: center; padding: 0.75rem; }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.5rem;
      margin-bottom: 1.5rem;
      cursor: pointer;
    }
    .custom-logo {
      max-height: 48px;
      max-width: 100%;
      background-color: white;
      border-radius: 6px;
      padding: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .custom-logo.collapsed-logo {
      max-height: 36px;
      padding: 4px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--st-border);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      margin: 0 0.25rem 1.25rem;
    }
    .search-box input {
      background: transparent;
      border: none;
      color: var(--st-text);
      font-size: 0.8rem;
      width: 100%;
      outline: none;
    }
    .search-box lucide-icon { color: var(--st-text-muted); flex-shrink: 0; }

    .nav-main { display: flex; flex-direction: column; gap: 2px; margin-bottom: 1.5rem; }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      color: var(--st-text-muted);
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: var(--st-transition);
      white-space: nowrap;
      overflow: hidden;
    }
    .nav-link:hover { background: rgba(139, 92, 246, 0.08); color: var(--st-text); }
    .nav-link.active {
      background: rgba(139, 92, 246, 0.15);
      color: var(--st-accent);
    }
    .nav-link .badge {
      font-size: 0.6rem;
      background: #ec4899;
      color: white;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--st-text-muted);
      padding: 0 0.75rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    .categories { display: flex; flex-direction: column; gap: 1px; }
    .nav-link.category { font-size: 0.82rem; padding: 0.5rem 0.75rem; }

    .sidebar-bottom { border-top: 1px solid var(--st-border); padding-top: 0.75rem; }

    /* ====== MAIN WRAPPER ====== */
    .main-wrapper {
      flex: 1;
      margin-left: 64px;
      transition: margin-left 0.25s ease;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .main-wrapper.shifted { margin-left: 240px; }

    /* ====== TOPBAR ====== */
    .topbar {
      position: sticky; top: 0;
      z-index: 150;
      background: var(--st-topbar);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--st-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 60px;
    }

    .topbar-nav { display: flex; gap: 0.25rem; }
    .topbar-nav a {
      color: var(--st-text-muted);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      padding: 0.4rem 1rem;
      border-radius: 8px;
      transition: var(--st-transition);
    }
    .topbar-nav a:hover { color: var(--st-text); background: rgba(255,255,255,0.04); }
    .topbar-nav a.active { color: var(--st-accent); background: rgba(139, 92, 246, 0.1); }

    .topbar-right { display: flex; align-items: center; gap: 0.75rem; }

    .search-topbar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--st-border);
      border-radius: 24px;
      padding: 0.4rem 1rem;
      width: 280px;
      transition: var(--st-transition);
    }
    .search-topbar:focus-within { border-color: var(--st-accent); box-shadow: 0 0 0 3px var(--st-accent-glow); }
    .search-topbar input {
      background: transparent;
      border: none;
      color: var(--st-text);
      font-size: 0.82rem;
      width: 100%;
      outline: none;
    }
    .search-topbar input::placeholder { color: var(--st-text-muted); }
    .search-topbar lucide-icon { color: var(--st-text-muted); flex-shrink: 0; }

    .icon-btn {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--st-border);
      color: var(--st-text-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: var(--st-transition);
    }
    .icon-btn:hover { background: rgba(139, 92, 246, 0.15); color: var(--st-accent); }

    .avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: var(--st-gradient-2);
      display: flex; align-items: center; justify-content: center;
      color: white;
      cursor: pointer;
      transition: var(--st-transition);
    }
    .avatar:hover { transform: scale(1.05); box-shadow: 0 0 12px var(--st-accent-glow); }
    .avatar-initials { font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px; }

    /* ====== CONTENT AREA ====== */
    .content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    /* ====== PROFILE MODAL ====== */
    .profile-details { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .p-avatar-large { width: 80px; height: 80px; border-radius: 50%; background: var(--st-gradient-2); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 800; margin-bottom: 1rem; box-shadow: 0 8px 16px rgba(139, 92, 246, 0.25); }
    .p-name { font-size: 1.25rem; font-weight: 700; color: var(--st-text); margin-bottom: 0.25rem; }
    .p-email { color: var(--st-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .p-info-grid { display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: center; flex-wrap: wrap; }
    .p-info-item { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; color: var(--st-text-muted); border: 1px solid var(--st-border); }
    .p-status { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; padding: 0.4rem 1rem; border-radius: 8px; margin-bottom: 2rem; background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .p-status.active { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .btn-logout-modal { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--st-border); background: var(--st-bg-card); color: var(--st-text); font-weight: 600; cursor: pointer; transition: var(--st-transition); margin-top: 1rem; }
    .btn-logout-modal:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-wrapper { margin-left: 0 !important; }
      .search-topbar { width: 160px; }
    }
  `]
})
export class StudentLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private knowledgeService = inject(KnowledgeService);
  themeService = inject(ThemeService);

  areas: any[] = [];
  searchTerm = '';
  sidebarCollapsed = false;

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

    this.knowledgeService.getAreas().subscribe(data => {
      this.areas = data.slice(0, 8); // Show max 8 categories
    });
  }

  openProfileModal() {
    this.isProfileModalOpen = true;
  }

  logout() {
    this.authService.logout();
  }
}
