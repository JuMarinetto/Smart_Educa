import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-retake-indicators-report',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="report-container">
      <header class="report-header">
        <h1>Indicadores de Refazimento</h1>
        <p>Alunos críticos, reprovados ou estagnados e ações recomendadas.</p>
      </header>
      
      <app-data-table 
        [title]="'Alunos em Situação Crítica'" 
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
  `]
})
export class RetakeIndicatorsReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome do Aluno' },
    { key: 'curso', label: 'Avaliação/Curso' },
    { key: 'indicador', label: 'Indicador' },
    { key: 'area', label: 'Área Crítica' },
    { key: 'nota', label: 'Nota' },
    { key: 'tentativas', label: 'Tentativas' },
    { key: 'dias_inativo', label: 'Dias desde Falha' },
    { key: 'acao', label: 'Ação Recomendada' }
  ];

  data: any[] = [];

  ngOnInit() {
    this.reportsService.getRetakeIndicatorsData().subscribe(res => {
      this.data = res;
    });
  }
}
