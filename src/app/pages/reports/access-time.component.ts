import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ReportsService } from '../../core/services/reports.service';

@Component({
  selector: 'app-access-time-report',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="report-container">
      <header class="report-header">
        <h1>Relatório de Acesso Temporal</h1>
        <p>Quem acessou, quando e por quanto tempo?</p>
      </header>
      
      <app-data-table 
        [title]="'Acessos de Usuários'" 
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
export class AccessTimeReportComponent implements OnInit {
  private reportsService = inject(ReportsService);

  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome do Usuário' },
    { key: 'perfil', label: 'Perfil' },
    { key: 'inicio', label: 'Data/Hora Início' },
    { key: 'fim', label: 'Data/Hora Fim' },
    { key: 'duracao', label: 'Duração Total' },
    { key: 'conteudo', label: 'Conteúdo Acessado' },
    { key: 'dispositivo', label: 'Dispositivo' }
  ];

  data: any[] = [];

  ngOnInit() {
    this.reportsService.getAccessLogsData().subscribe(res => {
      this.data = res;
    });
  }
}
