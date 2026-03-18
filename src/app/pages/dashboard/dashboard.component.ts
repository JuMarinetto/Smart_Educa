import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Users, Award, Clock, Moon, Sun, Filter } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { ThemeService } from '../../core/theme.service';
import { ReportsService } from '../../core/services/reports.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent, NgChartsModule, DragDropModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div>
          <h1>Visão Geral de Performance</h1>
          <p>Bem-vindo de volta, Administrador. Acompanhe os indicadores da sua organização.</p>
        </div>
        <div class="header-actions">
          <button class="action-btn"><lucide-icon name="Filter" size="18"></lucide-icon> Filtros</button>
          <button class="theme-toggle" (click)="themeService.toggleTheme()">
            <lucide-icon [name]="themeService.currentTheme() === 'light' ? 'Moon' : 'Sun'" size="20"></lucide-icon>
          </button>
        </div>
      </header>

      <div class="dashboard-tabs">
        <button [class.active]="activeTab === 'geral'" (click)="activeTab = 'geral'">Visão Geral</button>
        <button [class.active]="activeTab === 'aprendizagem'" (click)="activeTab = 'aprendizagem'">Aprendizagem</button>
        <button [class.active]="activeTab === 'avaliacoes'" (click)="activeTab = 'avaliacoes'">Avaliações</button>
        <button [class.active]="activeTab === 'franquias'" (click)="activeTab = 'franquias'">Franquias & Staff</button>
      </div>

      <div class="kpi-grid">
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon success"><lucide-icon [name]="'Users'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Total de Alunos</span>
              <span class="value">{{ kpis.totalAlunos || 0 }}</span>
              <span class="trend positive">Atualizado em tempo real</span>
            </div>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon primary"><lucide-icon [name]="'Award'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Taxa de Conclusão</span>
              <span class="value">{{ kpis.taxaConclusao || 0 }}%</span>
              <span class="trend positive">Média global</span>
            </div>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon warning"><lucide-icon [name]="'Clock'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Nota Média</span>
              <span class="value">{{ kpis.notaMedia || 0 }}</span>
              <span class="trend neutral">Últimas avaliações</span>
            </div>
          </div>
        </app-ui-card>
        <app-ui-card>
          <div class="kpi-content">
            <div class="kpi-icon danger"><lucide-icon [name]="'TrendingUp'" size="24"></lucide-icon></div>
            <div class="kpi-data">
              <span class="label">Taxa de Engajamento</span>
              <span class="value">{{ kpis.engajamento || 0 }}%</span>
              <span class="trend positive">Alunos ativos (30d)</span>
            </div>
          </div>
        </app-ui-card>
      </div>

      <!-- VISÃO GERAL (Personalizável com Drag & Drop) -->
      <div *ngIf="activeTab === 'geral'" class="tab-content">
        <div class="chart-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
          <div *ngFor="let widget of geralWidgets" cdkDrag class="widget-item">
             <app-ui-card>
              <div class="widget-header">
                <h3>{{ widget.title }}</h3>
                <lucide-icon name="Filter" size="14" class="drag-handle" cdkDragHandle></lucide-icon>
              </div>
              <div class="chart-container" [style.height.px]="widget.height || 260">
                <canvas baseChart [data]="widget.data" [options]="widget.options" [type]="widget.type"></canvas>
              </div>
            </app-ui-card>
          </div>
        </div>
      </div>

      <!-- APRENDIZAGEM -->
      <div *ngIf="activeTab === 'aprendizagem'" class="tab-content">
        <div class="chart-grid">
          <app-ui-card class="span-2">
            <h3>Tempo Médio Gasto por Módulo (Minutos)</h3>
            <div class="chart-container">
               <canvas baseChart [data]="timeSpentBarChartData" [options]="barChartOptions" [type]="'bar'"></canvas>
            </div>
          </app-ui-card>
          
          <app-ui-card>
            <h3>Funil de Conclusão</h3>
            <div class="funnel">
              <div class="funnel-step" style="width: 100%"><span>Inscritos</span><strong>2,500</strong></div>
              <div class="funnel-step" style="width: 85%"><span>Iniciaram</span><strong>2,125</strong></div>
              <div class="funnel-step" style="width: 60%"><span>Em Progresso</span><strong>1,500</strong></div>
              <div class="funnel-step" style="width: 40%"><span>Concluídos</span><strong>1,000</strong></div>
            </div>
          </app-ui-card>
        </div>
      </div>

      <!-- AVALIAÇÕES -->
      <div *ngIf="activeTab === 'avaliacoes'" class="tab-content">
        <div class="chart-grid">
          <app-ui-card class="span-2">
            <h3>Distribuição de Notas (Histograma)</h3>
            <div class="chart-container">
              <canvas baseChart [data]="gradesHistogramData" [options]="barChartOptions" [type]="'bar'"></canvas>
            </div>
          </app-ui-card>

          <app-ui-card>
            <h3>Taxa de Aprovação por Área</h3>
            <div class="chart-container">
               <canvas baseChart [data]="approvalPieChartData" [options]="pieChartOptions" [type]="'pie'"></canvas>
            </div>
          </app-ui-card>
        </div>
      </div>

      <!-- FRANQUIAS E STAFF -->
      <div *ngIf="activeTab === 'franquias'" class="tab-content">
        <div class="chart-grid">
          <app-ui-card class="span-3">
            <h3>Gap Analysis de Competências (Staff)</h3>
            <div class="chart-container" style="height: 300px;">
              <canvas baseChart [data]="gapAnalysisBarChartData" [options]="barChartOptions" [type]="'bar'"></canvas>
            </div>
          </app-ui-card>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-container { padding: 2rem; margin-left: 280px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .dashboard-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
    .dashboard-header p { color: var(--text-muted); margin: 0; }
    
    .header-actions { display: flex; gap: 1rem; align-items: center; }
    .action-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); border-radius: 6px; cursor: pointer; font-weight: 500; }
    
    .theme-toggle {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--bg-card); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--text-main); cursor: pointer;
    }

    .dashboard-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; overflow-x: auto; }
    .dashboard-tabs button { padding: 0.5rem 1.2rem; background: transparent; border: none; font-size: 0.95rem; font-weight: 500; color: var(--text-muted); cursor: pointer; border-radius: 6px; white-space: nowrap; transition: 0.2s; }
    .dashboard-tabs button:hover { background: rgba(0,0,0,0.05); }
    .dashboard-tabs button.active { background: var(--primary); color: white; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .kpi-content { display: flex; align-items: center; gap: 1rem; }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .kpi-icon.success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .kpi-icon.primary { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
    .kpi-icon.warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .kpi-icon.danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    
    .kpi-data { display: flex; flex-direction: column; }
    .label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.2rem; }
    .value { font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.1rem; }
    .trend { font-size: 0.75rem; font-weight: 600; }
    .trend.positive { color: var(--success); }
    .trend.negative { color: var(--danger); }
    .trend.neutral { color: var(--text-muted); }

    .chart-list { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .widget-item { cursor: move; }
    .widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .drag-handle { color: var(--text-muted); cursor: grab; }

    .chart-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .span-2 { grid-column: span 1; }
    .span-3 { grid-column: 1 / -1; }
    h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-main); margin: 0; }

    .chart-container { position: relative; width: 100%; height: 260px; }
    
    .funnel { display: flex; flex-direction: column; gap: 12px; align-items: center; justify-content: center; height: 260px; }
    .funnel-step { background: var(--primary); height: 45px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; color: white; font-size: 0.85rem; }
    .funnel-step:nth-child(2) { opacity: 0.85; background: #3b82f6; }
    .funnel-step:nth-child(3) { opacity: 0.7; background: #60a5fa; }
    .funnel-step:nth-child(4) { opacity: 0.55; background: #93c5fd; color: #1e3a8a; }
    .funnel-step strong { font-size: 1.1rem; }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }
    .cdk-drag-placeholder { opacity: 0.3; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .chart-list.cdk-drop-list-dragging .widget-item:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class DashboardComponent implements OnInit {
  themeService = inject(ThemeService);
  private reportsService = inject(ReportsService);

  activeTab: 'geral' | 'aprendizagem' | 'avaliacoes' | 'franquias' = 'geral';

  kpis: any = {};

  ngOnInit() {
    this.reportsService.getDashboardMetrics().subscribe(data => {
      this.kpis = data.kpis;
    });
  }

  onDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.geralWidgets, event.previousIndex, event.currentIndex);
  }

  // =============== WIDGETS DATA ===============
  geralWidgets: any[] = [
    {
      title: 'Taxa de Engajamento (Últimos 6 meses)',
      type: 'line',
      height: 260,
      data: {
        labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'],
        datasets: [{ data: [65, 70, 80, 81, 85, 94], label: 'Acessos por Semana', fill: true, tension: 0.4, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' } } }
    },
    {
      title: 'Desempenho por Área de Conhecimento',
      type: 'radar',
      height: 260,
      data: {
        labels: ['LGPD', 'Atendimento', 'Vendas', 'Seg. Info', 'Liderança', 'Técnico'],
        datasets: [{ data: [8.5, 9.0, 7.5, 8.8, 6.5, 9.5], label: 'Média de Notas', fill: true, borderColor: '#10b981', backgroundColor: 'rgba(16, 203, 129, 0.2)', pointBackgroundColor: '#10b981' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    },
    {
      title: 'Progresso Médio por Curso',
      type: 'bar',
      height: 300,
      data: {
        labels: ['Segurança 101', 'Liderança Exp.', 'Arquitetura', 'Gestão Ágil'],
        datasets: [
          { data: [60, 20, 10, 80], label: 'Aprovados', backgroundColor: '#10b981' },
          { data: [20, 40, 60, 10], label: 'Em Andamento', backgroundColor: '#f59e0b' },
          { data: [20, 40, 30, 10], label: 'Reprovados/Pendentes', backgroundColor: '#ef4444' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' } } }
    }
  ];

  // =============== APRENDIZAGEM ===============
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { stacked: true } },
    plugins: { legend: { position: 'bottom' } }
  };

  timeSpentBarChartData: ChartConfiguration['data'] = {
    labels: ['Mod 1', 'Mod 2', 'Mod 3', 'Mod 4', 'Mod 5', 'Mod 6'],
    datasets: [
      { data: [45, 30, 60, 25, 55, 40], label: 'Minutos Médios Gasto', backgroundColor: '#8b5cf6' }
    ]
  };

  // =============== AVALIAÇÕES ===============
  gradesHistogramData: ChartConfiguration['data'] = {
    labels: ['0-2', '2-4', '4-6', '6-8', '8-10'],
    datasets: [
      { data: [5, 15, 30, 80, 45], label: 'Qtd de Alunos (Frequência)', backgroundColor: '#06b6d4' }
    ]
  };

  pieChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  approvalPieChartData: ChartConfiguration['data'] = {
    labels: ['Aprovados (>= 7)', 'Reprovados (< 7)'],
    datasets: [
      { data: [76, 24], backgroundColor: ['#10b981', '#ef4444'], hoverOffset: 4 }
    ]
  };

  // =============== FRANQUIAS E STAFF ===============
  gapAnalysisBarChartData: ChartConfiguration['data'] = {
    labels: ['Comunicação', 'Resolução de Conflitos', 'Conhecimento Técnico', 'Liderança', 'Análise de Dados'],
    datasets: [
      { data: [85, 60, 90, 45, 70], label: 'Nível Atual (%)', backgroundColor: '#3b82f6' },
      { data: [15, 40, 10, 55, 30], label: 'Gap para a Meta (%)', backgroundColor: '#e2e8f0' }
    ]
  };
}