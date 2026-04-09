import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-performance-report',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="report-container">
      <header class="report-header">
        <h1>Relatório de Rendimento</h1>
        <p>Desempenho dos alunos, médias e taxa de conclusão.</p>
      </header>
      
      <div class="metrics-summary" *ngIf="metrics">
        <div class="metric-card">
          <span>Nota Média Geral</span>
          <strong>{{ metrics.notaMedia || 0 }}</strong>
        </div>
        <div class="metric-card">
          <span>Engajamento (30d)</span>
          <strong>{{ metrics.engajamento || 0 }}%</strong>
        </div>
        <div class="metric-card">
          <span>Taxa de Conclusão</span>
          <strong>{{ metrics.taxaConclusao || 0 }}%</strong>
        </div>
      </div>

      <app-data-table 
        [title]="'Detalhamento por Aluno'" 
        [columns]="columns" 
        [data]="data">
      </app-data-table>
    </div>
  `,
  styles: [`
    .report-container { padding: 2rem; margin-left: 280px; }
    .report-header { margin-bottom: 2rem; }
    .report-header h1 { font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem; }
    .report-header p { color: var(--text-muted); }
    
    .metrics-summary {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 1.5rem;
      border-radius: 8px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .metric-card span { color: var(--text-muted); font-size: 0.9rem; }
    .metric-card strong { font-size: 1.8rem; color: var(--primary); }
  `]
})
export class PerformanceReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'matricula', label: 'Matrícula' },
    { key: 'curso', label: 'Curso/Turma' },
    { key: 'media', label: 'Média Geral' },
    { key: 'av_realizadas', label: 'Avaliações Realizadas' },
    { key: 'av_aprovadas', label: 'Avaliações Aprovadas' },
    { key: 'status', label: 'Status' },
    { key: 'progresso', label: 'Progresso (%)' }
  ];

  data: any[] = [];
  metrics: any = null;

  ngOnInit() {
    this.reportsService.getDashboardMetrics().subscribe(res => {
      this.metrics = res.kpis;
    });

    this.reportsService.getPerformanceReportData().subscribe(res => {
      this.data = res;
    });
  }
}
