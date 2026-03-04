import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, BookOpen, CheckCircle, Lock, ChevronRight, LayoutDashboard, Users, Settings, Award } from 'lucide-angular';

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
        <div class="nav-item" routerLink="/certifications" routerLinkActive="active">
          <lucide-icon [name]="'Award'" size="18"></lucide-icon>
          <span>Certificações</span>
        </div>
      </nav>

      <nav class="nav-section">
        <p class="section-title">CURSO ATUAL</p>
        <div class="module">
          <div class="module-header">
            <span>Módulo 1: Fundamentos</span>
            <lucide-icon [name]="'ChevronRight'" size="14"></lucide-icon>
          </div>
          <div class="lessons">
            <div class="lesson completed">
              <lucide-icon [name]="'CheckCircle'" size="14"></lucide-icon>
              <span>Introdução à Segurança</span>
            </div>
            <div class="lesson active">
              <div class="dot"></div>
              <span>Protocolos de Acesso</span>
            </div>
            <div class="lesson locked">
              <lucide-icon [name]="'Lock'" size="14"></lucide-icon>
              <span>Criptografia Avançada</span>
            </div>
          </div>
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
    .sidebar {
      width: 280px;
      height: 100vh;
      background: var(--bg-sidebar);
      color: white;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 2.5rem;
      cursor: pointer;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: var(--primary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }
    .logo-text {
      font-weight: 700;
      letter-spacing: -0.5px;
      font-size: 1.1rem;
    }
    .logo-text span { color: var(--primary); }
    
    .nav-section { margin-bottom: 2rem; }
    .section-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 1rem;
      letter-spacing: 1px;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      color: #94a3b8;
      transition: var(--transition);
      cursor: pointer;
      margin-bottom: 4px;
      text-decoration: none;
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
    .nav-item.active { color: var(--primary); background: rgba(37, 99, 235, 0.1); }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #cbd5e1;
    }
    .lessons { margin-left: 1rem; margin-top: 0.5rem; }
    .lesson {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      color: #64748b;
      border-left: 1px solid #1e293b;
    }
    .lesson.completed { color: var(--success); }
    .lesson.active { color: white; border-left: 2px solid var(--primary); background: rgba(37, 99, 235, 0.1); }
    .lesson.locked { opacity: 0.5; }
    .dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; }

    .sidebar-footer { margin-top: auto; border-top: 1px solid #1e293b; padding-top: 1rem; }
  `]
})
export class SidebarComponent {
  readonly LayoutDashboard = LayoutDashboard;
  readonly BookOpen = BookOpen;
  readonly Award = Award;
  readonly Settings = Settings;
  readonly ChevronRight = ChevronRight;
  readonly CheckCircle = CheckCircle;
  readonly Lock = Lock;
}