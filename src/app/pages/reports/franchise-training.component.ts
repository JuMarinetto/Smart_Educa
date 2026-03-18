import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-franchise-training-report',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  template: `
    <div class="report-container">
      <header class="report-header">
        <h1>Treinamento de Franquia</h1>
        <p>Acompanhamento de gerentes e requisitos de franqueados.</p>
      </header>
      
      <app-data-table 
        [title]="'Status de Gerentes'" 
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
export class FranchiseTrainingReportComponent {
  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome do Gerente' },
    { key: 'cpf', label: 'CPF' },
    { key: 'franquia', label: 'Franquia' },
    { key: 'regiao', label: 'Região' },
    { key: 'data', label: 'Data de Visualização' },
    { key: 'tempo', label: 'Tempo Assistido' },
    { key: 'status', label: 'Status' },
    { key: 'ultima_visita', label: 'Última Visualização' }
  ];

  data = [
    { nome: 'Fernando Silva', cpf: '111.222.333-44', franquia: 'Loja Centro', regiao: 'Sul', data: '10/10/2026', tempo: '01:20:00', status: 'Completo', ultima_visita: '10/10/2026' },
    { nome: 'Mariana Souza', cpf: '222.333.444-55', franquia: 'Loja Norte', regiao: 'Norte', data: '12/10/2026', tempo: '00:15:00', status: 'Parcial', ultima_visita: '12/10/2026' },
    { nome: 'Carlos Oliveira', cpf: '333.444.555-66', franquia: 'Loja Leste', regiao: 'Sudeste', data: '-', tempo: '00:00:00', status: 'Não Iniciado', ultima_visita: '-' }
  ];
}
