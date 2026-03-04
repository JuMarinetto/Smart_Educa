import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, BookOpen, CheckCircle, Lock, ChevronRight, LayoutDashboard, Users, Settings, Award, Plus, Edit, Trash, FileText, Layers, PenTool } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <aside class="sidebar">
      <div class="logo" routerLink="/">
        <div class="logo-icon">N</div>
        <span class="logo-text">NEXUS<span>LMS</span></span>
      </div>

      <nav class="nav-section">
        <p class="section-title">PRINCIPAL</p>
        <div class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <lucide-icon [name]="'LayoutDashboard'" size="18"></lucide-icon>
          <span>Dashboard</span>
        </div>
        <div class="nav-item" routerLink="/courses" routerLinkActive="active">
          <lucide-icon [name]="'BookOpen'" size="18"></lucide-icon>
          <span>Meus Cursos</span>
        </div>
      </nav>

      <nav class="nav-section">
        <p class="section-title">ADMINISTRAÇÃO</p>
        <div class="nav-item" routerLink="/admin/knowledge-areas" routerLinkActive="active">
          <lucide-icon [name]="'Layers'" size="18"></lucide-icon>
          <span>Áreas de Conhecimento</span>
        </div>
        <div class="nav-item" routerLink="/admin/contents" routerLinkActive="active">
          <lucide-icon [name]="'FileText'" size="18"></lucide-icon>
          <span>Biblioteca de Conteúdos</span>
        </div>
        <div class="nav-item" routerLink="/admin/course-builder" routerLinkActive="active">
          <lucide-icon [name]="'PenTool'" size="18"></lucide-icon>
          <span>Construtor de Cursos</span>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="nav-item" routerLink="/settings" routerLinkActive="active">
          <lucide-icon [name]="'Settings'" size="18"></lucide-icon>
          <span>Configurações</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar { width: 280px; height: 100vh; background: var(--bg-sidebar); color: white; display: flex; flex-direction: column; padding: 1.5rem; position: fixed; left: 0; top: 0; z-index: 100; }
    .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 2.5rem; cursor: pointer; }
    .logo-icon { width: 32px; height: 32px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; }
    .logo-text { font-weight: 700; letter-spacing: -0.5px; font-size: 1.1rem; }
    .logo-text span { color: var(--primary); }
    .nav-section { margin-bottom: 2rem; }
    .section-title { font-size: 0.7rem; font-weight: 600; color: #64748b; margin-bottom: 1rem; letter-spacing: 1px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 0.75rem 1rem; border-radius: 8px; color: #94a3b8; transition: var(--transition); cursor: pointer; margin-bottom: 4px; text-decoration: none; }
    .nav-item:hover, .nav-item.active { background: rgba(255, 255, 255, 0.05); color: white; }
    .nav-item.active { color: var(--primary); background: rgba(37, 99, 235, 0.1); }
    .sidebar-footer { margin-top: auto; border-top: 1px solid #1e293b; padding-top: 1rem; }
  `]
})
export class SidebarComponent {}