import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-content-accessed-report',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="report-container">
      <header class="report-header">
        <h1>Relatório de Conteúdo Acessado</h1>
        <p>O que cada um acessou detalhadamente.</p>
      </header>
      
      <app-data-table 
        [title]="'Conteúdos Visualizados'" 
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
export class ContentAccessedReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome do Usuário' },
    { key: 'curso', label: 'Curso' },
    { key: 'modulo', label: 'Módulo' },
    { key: 'conteudo', label: 'Conteúdo Acessado' },
    { key: 'data', label: 'Data do Acesso' },
    { key: 'tempo', label: 'Tempo Gasto' },
    { key: 'status', label: 'Status' },
    { key: 'conclusao', label: '% Conclusão' }
  ];

  data: any[] = [];

  ngOnInit() {
    this.reportsService.getContentAccessedData().subscribe(res => {
      this.data = res;
    });
  }
}
