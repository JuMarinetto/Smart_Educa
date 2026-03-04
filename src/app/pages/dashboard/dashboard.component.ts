import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Users, Award, Clock, Moon, Sun } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div>
          <h1>Visão Geral de Performance</h1>
          <p>Bem-vindo de volta, Administrador. Aqui está o status da sua organização.</p>
        </div>
        <button class="theme-toggle" (click)="themeService.toggleTheme()">
          <lucide-icon [name]="themeService.currentTheme() === 'light' ? 'Moon' : 'Sun'" size="20"></lucide-icon>
        </button>
      </header>

      <div class="kpi-grid">
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon success"><lucide-icon [name]="'Users'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Usuários Ativos</span>
              <span class="value">1,284</span>
              <span class="trend positive">+12% este mês</span>
            </div>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon primary"><lucide-icon [name]="'Award'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Certificações Emitidas</span>
              <span class="value">452</span>
              <span class="trend positive">+5% este mês</span>
            </div>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon warning"><lucide-icon [name]="'Clock'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Tempo Médio / Módulo</span>
              <span class="value">42m</span>
              <span class="trend negative">-2m vs meta</span>
            </div>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon danger"><lucide-icon [name]="'TrendingUp'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Taxa de Conformidade</span>
              <span class="value">94.2%</span>
              <span class="trend positive">Dentro da meta</span>
            </div>
          </div>
        </app-ui-card>
      </div>

      <div class="main-grid">
        <app-ui-card class="span-2">
          <h3>Heatmap de Engajamento Semanal</h3>
          <div class="heatmap">
            <div *ngFor="let day of days" class="heatmap-row">
              <span class="day-label">{{day}}</span>
              <div class="cells">
                <div *ngFor="let cell of [1,2,3,4,5,6,7,8,9,10,11,12]" 
                     class="cell" 
                     [style.opacity]="getRandomOpacity()"></div>
              </div>
            </div>
          </div>
        </app-ui-card>

        <app-ui-card>
          <h3>Funil de Treinamento</h3>
          <div class="funnel">
            <div class="funnel-step" style="width: 100%">
              <span class="step-label">Inscritos</span>
              <span class="step-value">2,500</span>
            </div>
            <div class="funnel-step" style="width: 85%">
              <span class="step-label">Iniciaram</span>
              <span class="step-value">2,125</span>
            </div>
            <div class="funnel-step" style="width: 60%">
              <span class="step-label">Em Progresso</span>
              <span class="step-value">1,500</span>
            </div>
            <div class="funnel-step" style="width: 40%">
              <span class="step-label">Concluídos</span>
              <span class="step-value">1,000</span>
            </div>
          </div>
        </app-ui-card>
      </div>

      <div class="courses-section">
        <h3>Cursos em Destaque</h3>
        <div class="course-grid">
          <app-ui-card [interactive]="true" *ngFor="let course of courses">
            <div class="course-card">
              <div class="course-image" [style.background-image]="'url(' + course.img + ')'">
                <span class="badge" [class]="course.status">{{course.status}}</span>
              </div>
              <div class="course-info">
                <h4>{{course.title}}</h4>
                <p>{{course.desc}}</p>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width]="course.progress + '%'"></div>
                  </div>
                  <span>{{course.progress}}%</span>
                </div>
              </div>
            </div>
          </app-ui-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 2rem; margin-left: 280px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .dashboard-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--text-main); }
    .dashboard-header p { color: var(--text-muted); }
    
    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-card);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-main);
    }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-content { display: flex; align-items: center; gap: 1rem; }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon.success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .kpi-icon.primary { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
    .kpi-icon.warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .kpi-icon.danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    
    .kpi-data { display: flex; flex-direction: column; }
    .label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .value { font-size: 1.4rem; font-weight: 700; color: var(--text-main); }
    .trend { font-size: 0.75rem; font-weight: 600; }
    .trend.positive { color: var(--success); }
    .trend.negative { color: var(--danger); }

    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .span-2 { grid-column: span 1; }
    h3 { margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600; }

    .heatmap { display: flex; flex-direction: column; gap: 8px; }
    .heatmap-row { display: flex; align-items: center; gap: 12px; }
    .day-label { width: 30px; font-size: 0.7rem; color: var(--text-muted); }
    .cells { display: flex; gap: 4px; flex: 1; }
    .cell { height: 20px; flex: 1; background: var(--primary); border-radius: 3px; }

    .funnel { display: flex; flex-direction: column; gap: 12px; align-items: center; }
    .funnel-step { 
      background: var(--primary); 
      height: 40px; 
      border-radius: 6px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 0 1rem;
      color: white;
      font-size: 0.8rem;
      opacity: 0.9;
    }
    .funnel-step:nth-child(2) { opacity: 0.75; }
    .funnel-step:nth-child(3) { opacity: 0.6; }
    .funnel-step:nth-child(4) { opacity: 0.45; }

    .course-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .course-image { height: 140px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 1rem; position: relative; }
    .badge { position: absolute; top: 10px; right: 10px; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .badge.Obrigatório { background: var(--danger); color: white; }
    .badge.Opcional { background: var(--info); color: white; }
    
    .course-info h4 { margin-bottom: 0.5rem; font-size: 1rem; }
    .course-info p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4; }
    
    .progress-container { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 600; }
    .progress-bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--success); border-radius: 3px; }
  `]
})
export class DashboardComponent {
  themeService = inject(ThemeService);
  days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  courses = [
    { title: 'Segurança da Informação 2024', desc: 'Protocolos críticos e conformidade LGPD para todos os setores.', progress: 85, status: 'Obrigatório', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80' },
    { title: 'Liderança Exponencial', desc: 'Desenvolvimento de soft skills e gestão de times remotos.', progress: 30, status: 'Opcional', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80' },
    { title: 'Arquitetura de Sistemas', desc: 'Escalabilidade e performance em ambientes cloud.', progress: 0, status: 'Opcional', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80' }
  ];

  getRandomOpacity() {
    return Math.random() * 0.8 + 0.2;
  }
}