import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-staff-capacity-report',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="report-container">
      <header class="report-header">
        <h1>Capacitação de Funcionários</h1>
        <p>Matriz de competências e identificação de lacunas por departamento.</p>
      </header>
      
      <app-data-table 
        [title]="'Detalhes por Funcionário'" 
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
export class StaffCapacityReportComponent {
  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'depto', label: 'Departamento' },
    { key: 'curso', label: 'Curso Realizado' },
    { key: 'data', label: 'Data Conclusão' },
    { key: 'status', label: 'Status' },
    { key: 'validade', label: 'Validade Cert.' },
    { key: 'proximo', label: 'Próximo Treinamento' }
  ];

  data = [
    { nome: 'Alice Matos', cargo: 'Atendente', depto: 'Suporte', curso: 'Atendimento N1', data: '05/09/2026', status: 'Concluído', validade: '05/09/2027', proximo: 'Atendimento N2' },
    { nome: 'Bruno Castro', cargo: 'Eng. de Software', depto: 'TI', curso: 'Segurança da Informação', data: '-', status: 'Em Andamento', validade: '-', proximo: 'Clean Code' },
    { nome: 'Camila Gomes', cargo: 'Gerente', depto: 'Vendas', curso: 'Liderança Exponencial', data: '20/08/2026', status: 'Concluído', validade: '20/08/2029', proximo: 'Técnicas de Negociação' },
    { nome: 'Diego Luz', cargo: 'Estagiário', depto: 'TI', curso: 'Segurança da Informação', data: '-', status: 'Não Iniciado', validade: '-', proximo: 'Segurança Básica' }
  ];
}
