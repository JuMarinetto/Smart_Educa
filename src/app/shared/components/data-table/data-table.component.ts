import { Component, Input, OnChanges, SimpleChanges, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Download, FileText, ChevronUp, ChevronDown, Search, X, Edit, Trash } from 'lucide-angular';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { MaskSensitivePipe } from '../../../core/pipes/mask-sensitive.pipe';
import { DateFormatPipe } from '../../../core/pipes/date-format.pipe';
import { ReportsService } from '../../../core/services/reports.service';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'mask' | 'currency';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MaskSensitivePipe, DateFormatPipe],
  providers: [DateFormatPipe],
  template: `
    <div class="table-container">
      <div class="table-header">
        <h3 *ngIf="title">{{ title }}</h3>
        
        <div class="table-actions">
          <div class="search-box">
            <lucide-icon name="Search" size="18"></lucide-icon>
            <input type="text" [ngModel]="searchTerm" (ngModelChange)="searchTerm = $event; filterData()" placeholder="Buscar...">
          </div>
          
          <div class="export-buttons">
            <button (click)="openExportModal('pdf')" class="btn-export pdf" title="Exportar PDF">
              <lucide-icon name="FileText" size="18"></lucide-icon> PDF
            </button>
            <button (click)="openExportModal('excel')" class="btn-export excel" title="Exportar Excel">
              <lucide-icon name="Download" size="18"></lucide-icon> Excel
            </button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th *ngFor="let col of columns" (click)="sort(col.key)" [class.sortable]="true">
                {{ col.label }}
                <span class="sort-icon" *ngIf="sortKey === col.key">
                  <lucide-icon [name]="sortDesc ? 'ChevronDown' : 'ChevronUp'" size="16"></lucide-icon>
                </span>
              </th>
              <th class="actions-column" *ngIf="showActions">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of paginatedData">
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'date'">{{ row[col.key] | dateFormat }}</span>
                  <span *ngSwitchCase="'mask'">{{ row[col.key] | maskSensitive:col.key }}</span>
                  <span *ngSwitchDefault>{{ row[col.key] }}</span>
                </ng-container>
              </td>
              <td class="actions-cell" *ngIf="showActions">
                <button class="btn-action edit" (click)="edit.emit(row)" title="Editar">
                  <lucide-icon name="Edit" size="16"></lucide-icon>
                </button>
                <button class="btn-action delete" (click)="delete.emit(row)" title="Excluir">
                  <lucide-icon name="Trash" size="16"></lucide-icon>
                </button>
              </td>
            </tr>
            <tr *ngIf="paginatedData.length === 0">
              <td [attr.colspan]="columns.length" class="empty-state">Nenhum registro encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="filteredData.length > pageSize">
        <span class="page-info">
          Mostrando {{ (currentPage - 1) * pageSize + 1 }} a {{ Math.min(currentPage * pageSize, filteredData.length) }} de {{ filteredData.length }} registros
        </span>
        <div class="page-controls">
          <button [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">Anterior</button>
          <button *ngFor="let p of pages" 
                  [class.active]="p === currentPage" 
                  (click)="changePage(p)">{{ p }}</button>
          <button [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">Próximo</button>
        </div>
      </div>
      
      <!-- Export Justification Modal -->
      <div class="modal-overlay" *ngIf="showExportModal">
        <div class="modal-content">
          <div class="modal-header">
            <h4>Justificativa de Exportação</h4>
            <button class="close-btn" (click)="closeExportModal()">
              <lucide-icon name="X" size="20"></lucide-icon>
            </button>
          </div>
          <div class="modal-body">
            <p>Para exportar dados sensíveis do relatório <strong>{{ title || 'Relatório' }}</strong>, por favor forneça uma justificativa.</p>
            <textarea [(ngModel)]="exportJustification" rows="3" placeholder="Qual a finalidade deste download? (obrigatório)"></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeExportModal()">Cancelar</button>
            <button class="btn-confirm" [disabled]="!exportJustification.trim()" (click)="confirmExport()">Confirmar e Exportar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-md);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .table-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }

    .table-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box lucide-icon {
      position: absolute;
      left: 10px;
      color: var(--text-muted);
    }

    .search-box input {
      padding: 0.5rem 1rem 0.5rem 2.2rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg-main);
      color: var(--text-main);
      font-size: 0.9rem;
      width: 250px;
      transition: border-color 0.2s;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--primary);
    }

    .export-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-export {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      color: white;
      transition: opacity 0.2s;
    }
    .btn-export:hover { opacity: 0.9; }
    .btn-export.pdf { background: #ef4444; }
    .btn-export.excel { background: #10b981; }

    .table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th, .data-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-main);
    }

    .data-table th {
      background: rgba(139, 92, 246, 0.05);
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    
    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }
    
    .data-table th.sortable:hover {
      background: rgba(139, 92, 246, 0.1);
    }

    .sort-icon {
      display: inline-block;
      vertical-align: middle;
      margin-left: 5px;
    }

    .data-table tbody tr:hover {
      background: rgba(139, 92, 246, 0.05);
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .page-controls {
      display: flex;
      gap: 0.25rem;
    }

    .page-controls button {
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--border);
      background: var(--bg-card);
      color: var(--text-main);
      border-radius: 4px;
      cursor: pointer;
    }

    .page-controls button:hover:not([disabled]) {
      background: var(--bg-main);
    }

    .page-controls button.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .page-controls button[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: var(--bg-card); width: 450px; border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .modal-header h4 { margin: 0; font-size: 1.1rem; color: var(--text-main); }
    .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .modal-body p { margin-bottom: 1rem; color: var(--text-muted); font-size: 0.9rem; }
    .modal-body textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-main); color: var(--text-main); resize: vertical; margin-bottom: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn-cancel { padding: 0.5rem 1rem; border: 1px solid var(--border); background: transparent; color: var(--text-main); border-radius: 6px; cursor: pointer; }
    .btn-confirm { padding: 0.5rem 1rem; border: none; background: var(--primary); color: white; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-confirm[disabled] { opacity: 0.5; cursor: not-allowed; }

    .actions-column { width: 100px; text-align: center; }
    .actions-cell { display: flex; gap: 8px; justify-content: center; }
    .btn-action { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .btn-action.edit { color: var(--primary); }
    .btn-action.edit:hover { background: rgba(37, 99, 235, 0.1); }
    .btn-action.delete { color: var(--danger); }
    .btn-action.delete:hover { background: rgba(239, 68, 68, 0.1); }
  `]
})
export class DataTableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() title: string = '';
  @Input() pageSize: number = 10;
  @Input() showActions: boolean = true;

  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();

  reportsService = inject(ReportsService);
  private dateFormatPipe = inject(DateFormatPipe);

  Math = Math;

  filteredData: any[] = [];
  searchTerm: string = '';
  sortKey: string = '';
  sortDesc: boolean = false;

  currentPage: number = 1;

  // Export Modal State
  showExportModal = false;
  exportType: 'pdf' | 'excel' = 'pdf';
  exportJustification = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.filterData();
    }
  }

  filterData() {
    let result = [...this.data];

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(item =>
        this.columns.some(col => {
          const val = item[col.key];
          if (val === null || val === undefined) return false;

          let searchableVal = '';
          
          if (typeof val === 'boolean') {
            searchableVal = val ? 'ativo sim' : 'inativo não';
          } else if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val))) {
            // Provável data ISO
            const date = new Date(val);
            searchableVal = val + ' ' + date.toLocaleDateString('pt-BR');
          } else {
            searchableVal = val.toString();
          }

          return searchableVal.toLowerCase().includes(term);
        })
      );
    }

    // Sort
    if (this.sortKey) {
      result.sort((a, b) => {
        const valA = a[this.sortKey];
        const valB = b[this.sortKey];
        if (valA < valB) return this.sortDesc ? 1 : -1;
        if (valA > valB) return this.sortDesc ? -1 : 1;
        return 0;
      });
    }

    this.filteredData = result;
    this.currentPage = 1; // Reset to first page
  }

  sort(key: string) {
    if (this.sortKey === key) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortKey = key;
      this.sortDesc = false;
    }
    this.filterData();
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  get pages() {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  openExportModal(type: 'pdf' | 'excel') {
    this.exportType = type;
    this.exportJustification = '';
    this.showExportModal = true;
  }

  closeExportModal() {
    this.showExportModal = false;
  }

  async confirmExport() {
    // Log to Supabase
    await this.reportsService.logReportExport(
      this.title || 'Relatório Genérico',
      this.exportType === 'pdf' ? 'EXPORT_PDF' : 'EXPORT_EXCEL',
      this.exportJustification,
      { search: this.searchTerm, sort: this.sortKey }
    );

    this.closeExportModal();

    if (this.exportType === 'pdf') {
      this.exportPDF();
    } else {
      this.exportExcel();
    }
  }

  // Exports
  exportPDF() {
    const doc = new jsPDF();
    const head = [this.columns.map(c => c.label)];
    const body = this.filteredData.map(row =>
      this.columns.map(c => this.dateFormatPipe.transform(row[c.key]))
    );

    if (this.title) {
      doc.text(this.title, 14, 15);
    }

    autoTable(doc, {
      head: head,
      body: body,
      startY: this.title ? 20 : 10,
      styles: { fontSize: 8 }
    });

    const filename = this.title ? `${this.title.replace(/ /g, '_')}.pdf` : 'relatorio.pdf';
    doc.save(filename);
  }

  async exportExcel() {
    // Map data to Portuguese labels for Excel headers
    const excelData = this.filteredData.map(row => {
      const formattedRow: any = {};
      this.columns.forEach(col => {
        formattedRow[col.label] = this.dateFormatPipe.transform(row[col.key]);
      });
      return formattedRow;
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');
    
    // Add columns with headers
    if (this.columns.length > 0) {
      worksheet.columns = this.columns.map(col => ({
        header: col.label,
        key: col.label,
        width: 20
      }));

      // Add data rows
      excelData.forEach(data => {
        worksheet.addRow(data);
      });
      
      // Styling the header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE9E9E9' }
      };
    }

    const filename = this.title ? `${this.title.replace(/ /g, '_')}.xlsx` : 'relatorio.xlsx';
    
    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
