import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Users, Award, Clock, Moon, Sun, Filter, BarChart2 } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { ThemeService } from '../../core/theme.service';
import { ReportsService, DashboardFilters } from '../../core/services/reports.service';
import { CourseService } from '../../core/services/course.service';
import { ClassService } from '../../core/services/class.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent, NgChartsModule, DragDropModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div>
          <h1>Visão Geral de Performance</h1>
          <p>Bem-vindo de volta, Administrador. Acompanhe os indicadores da sua organização.</p>
        </div>
        
        <div class="header-actions">
          <div class="filter-group" [class.open]="showFilters">
            <button class="action-btn" (click)="showFilters = !showFilters">
              <lucide-icon name="Filter" size="18"></lucide-icon> Filtros
            </button>
            <div class="filter-dropdown" *ngIf="showFilters">
              <div class="filter-item">
                <label>Curso</label>
                <select [(ngModel)]="filters.courseId" (change)="applyFilters()">
                  <option [value]="undefined">Todos os Cursos</option>
                  <option *ngFor="let c of courses" [value]="c.id">{{ c.titulo }}</option>
                </select>
              </div>
              <div class="filter-item">
                <label>Turma / Unidade</label>
                <select [(ngModel)]="filters.classId" (change)="applyFilters()">
                  <option [value]="undefined">Todas as Turmas</option>
                  <option *ngFor="let t of classes" [value]="t.id">{{ t.nome_turma }}</option>
                </select>
              </div>
            </div>
          </div>
          
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
            <div class="funnel" *ngIf="funnelData">
              <div class="funnel-step" [style.width]="'100%'">
                <span>Inscritos</span><strong>{{ funnelData.inscritos || 0 | number }}</strong>
              </div>
              <div class="funnel-step" [style.width]="((funnelData.iniciaram / funnelData.inscritos) * 100) + '%'">
                <span>Iniciaram</span><strong>{{ funnelData.iniciaram || 0 | number }}</strong>
              </div>
              <div class="funnel-step" [style.width]="((funnelData.emProgresso / funnelData.inscritos) * 100) + '%'">
                <span>Em Progresso</span><strong>{{ funnelData.emProgresso || 0 | number }}</strong>
              </div>
              <div class="funnel-step" [style.width]="((funnelData.concluidos / funnelData.inscritos) * 100) + '%'">
                <span>Concluídos</span><strong>{{ funnelData.concluidos || 0 | number }}</strong>
              </div>
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
            <h3>Gap Analysis de Competências (Média vs Meta)</h3>
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
    
    .filter-group { position: relative; }
    .filter-dropdown { 
      position: absolute; top: 110%; right: 0; 
      background: var(--bg-card); border: 1px solid var(--border); 
      border-radius: 8px; padding: 1rem; width: 250px; z-index: 100;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      display: flex; flex-direction: column; gap: 1rem;
    }
    .filter-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .filter-item label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
    .filter-item select { padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); }

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
    .funnel-step { background: var(--primary); height: 45px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; color: white; font-size: 0.85rem; transition: width 0.5s ease-in-out; min-width: 100px; }
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
  private courseService = inject(CourseService);
  private classService = inject(ClassService);

  activeTab: 'geral' | 'aprendizagem' | 'avaliacoes' | 'franquias' = 'geral';
  kpis: any = {};
  showFilters = false;
  filters: DashboardFilters = {};
  courses: any[] = [];
  classes: any[] = [];
  funnelData: any;

  ngOnInit() {
    this.loadData();
    this.loadFilterOptions();
  }

  loadData() {
    this.reportsService.getDashboardMetrics(this.filters).subscribe(data => {
      this.kpis = data.kpis;
    });

    this.reportsService.getDashboardCharts(this.filters).subscribe(charts => {
      if (charts) {
        this.updateCharts(charts);
      }
    });
  }

  loadFilterOptions() {
    this.courseService.getCourses().subscribe(data => this.courses = (data as any[]));
    this.classService.getClasses().subscribe(data => this.classes = data);
  }

  applyFilters() {
    this.loadData();
    // Fechar filtros após aplicar? Talvez melhor não para o usuário experimentar
  }

  private updateCharts(charts: any) {
    // 1. Engajamento
    if (charts.engagement) {
      this.geralWidgets[0].data = {
        ...this.geralWidgets[0].data,
        datasets: [{
          ...this.geralWidgets[0].data.datasets[0],
          data: charts.engagement
        }]
      };
    }

    // 2. Áreas de Conhecimento
    if (charts.knowledgeAreas) {
      this.geralWidgets[1].data = {
        labels: charts.knowledgeAreas.map((a: any) => a.name),
        datasets: [{
          ...this.geralWidgets[1].data.datasets[0],
          data: charts.knowledgeAreas.map((a: any) => a.value)
        }]
      };

      // Gap Analysis (Comparando com meta 7.0)
      this.gapAnalysisBarChartData = {
        labels: charts.knowledgeAreas.map((a: any) => a.name),
        datasets: [
          { data: charts.knowledgeAreas.map((a: any) => a.value), label: 'Média Atual', backgroundColor: '#3b82f6' },
          { data: charts.knowledgeAreas.map((a: any) => Math.max(0, 7.0 - a.value)), label: 'Gap para Meta (7.0)', backgroundColor: '#e2e8f0' }
        ]
      };
    }

    // 3. Progresso por Curso
    if (charts.courseProgress) {
      this.geralWidgets[2].data = {
        labels: charts.courseProgress.map((c: any) => c.titulo),
        datasets: [
          { data: charts.courseProgress.map((c: any) => c.aprovados), label: 'Aprovados', backgroundColor: '#10b981' },
          { data: charts.courseProgress.map((c: any) => c.andamento), label: 'Em Andamento', backgroundColor: '#f59e0b' },
          { data: charts.courseProgress.map((c: any) => c.pendentes), label: 'Não Iniciado/Outros', backgroundColor: '#ef4444' }
        ]
      };
    }

    // 4. Aprendizagem - Tempo Spent
    if (charts.timeSpent) {
      this.timeSpentBarChartData = {
        ...this.timeSpentBarChartData,
        datasets: [{ ...this.timeSpentBarChartData.datasets[0], data: charts.timeSpent }]
      };
    }

    // 5. Histograma de Notas
    if (charts.histogram) {
      this.gradesHistogramData = {
        ...this.gradesHistogramData,
        datasets: [{ ...this.gradesHistogramData.datasets[0], data: charts.histogram }]
      };
    }

    // 6. Funil
    if (charts.funnel) {
      this.funnelData = charts.funnel;
    }

    // 7. Pie Chart de Aprovação (Heurística baseada na média geral)
    const avg = this.kpis.notaMedia || 0;
    this.approvalPieChartData = {
      ...this.approvalPieChartData,
      datasets: [{
        ...this.approvalPieChartData.datasets[0],
        data: [Math.round(avg * 10), Math.round(100 - (avg * 10))]
      }]
    };
  }

  onDrop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.geralWidgets, event.previousIndex, event.currentIndex);
  }

  // =============== WIDGETS DATA (Default/Structures) ===============
  geralWidgets: any[] = [
    {
      title: 'Taxa de Engajamento (Últimos 6 meses)',
      type: 'line',
      height: 260,
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{ data: [65, 70, 80, 81, 85, 94], label: 'Acessos Semanais', fill: true, tension: 0.4, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.2)' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    },
    {
      title: 'Desempenho por Área de Conhecimento',
      type: 'radar',
      height: 260,
      data: {
        labels: ['Geral'],
        datasets: [{ data: [0], label: 'Média de Notas', fill: true, borderColor: '#10b981', backgroundColor: 'rgba(16, 203, 129, 0.2)', pointBackgroundColor: '#10b981' }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    },
    {
      title: 'Status de Alunos por Curso',
      type: 'bar',
      height: 300,
      data: {
        labels: [],
        datasets: []
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' } } }
    }
  ];

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true }, y: { stacked: true } },
    plugins: { legend: { position: 'bottom' } }
  };

  timeSpentBarChartData: ChartConfiguration['data'] = {
    labels: ['Mód 1', 'Mód 2', 'Mód 3', 'Mód 4', 'Mód 5', 'Mód 6'],
    datasets: [{ data: [45, 30, 60, 25, 55, 40], label: 'Minutos Médios Gasto', backgroundColor: '#8b5cf6' }]
  };

  gradesHistogramData: ChartConfiguration['data'] = {
    labels: ['0-2', '2-4', '4-6', '6-8', '8-10'],
    datasets: [{ data: [0, 0, 0, 0, 0], label: 'Qtd de Alunos', backgroundColor: '#06b6d4' }]
  };

  pieChartOptions: ChartConfiguration['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  approvalPieChartData: ChartConfiguration['data'] = {
    labels: ['Aprovados (>= 7)', 'Reprovados (< 7)'],
    datasets: [{ data: [76, 24], backgroundColor: ['#10b981', '#ef4444'], hoverOffset: 4 }]
  };

  gapAnalysisBarChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Média Atual', backgroundColor: '#3b82f6' },
      { data: [], label: 'Gap para Meta', backgroundColor: '#e2e8f0' }
    ]
  };
}