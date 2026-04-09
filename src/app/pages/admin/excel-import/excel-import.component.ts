import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ExcelImportService, ExcelImportData, ImportResult } from '../../../core/services/excel-import.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

type Step = 'upload' | 'preview' | 'result';

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Importar Excel</h1>
          <p>Faça upload de uma planilha para criar cursos, módulos, conteúdos e questões em lote.</p>
        </div>
        <button class="btn-template" (click)="downloadTemplate()">
          <lucide-icon name="Download" size="16"></lucide-icon>
          Baixar Planilha Modelo
        </button>
      </header>

      <!-- Stepper -->
      <div class="stepper">
        <div class="step" [class.active]="step === 'upload'" [class.done]="step !== 'upload'">
          <div class="step-circle">
            <lucide-icon *ngIf="step === 'upload'" name="Upload" size="16"></lucide-icon>
            <lucide-icon *ngIf="step !== 'upload'" name="Check" size="16"></lucide-icon>
          </div>
          <span>1. Upload</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step === 'preview'" [class.done]="step === 'result'">
          <div class="step-circle">
            <lucide-icon *ngIf="step !== 'result'" name="Eye" size="16"></lucide-icon>
            <lucide-icon *ngIf="step === 'result'" name="Check" size="16"></lucide-icon>
          </div>
          <span>2. Preview</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="step === 'result'">
          <div class="step-circle">
            <lucide-icon name="ClipboardList" size="16"></lucide-icon>
          </div>
          <span>3. Resultado</span>
        </div>
      </div>

      <!-- ── STEP 1: UPLOAD ───────────────────────────────── -->
      <div *ngIf="step === 'upload'" class="card">
        <div class="drop-zone" (click)="fileInput.click()" (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
          <lucide-icon name="FileSpreadsheet" size="48" class="icon-upload"></lucide-icon>
          <p class="drop-title">Clique para selecionar ou arraste o arquivo aqui</p>
          <p class="drop-hint">Somente arquivos <strong>.xlsx</strong> são suportados</p>
          <input #fileInput type="file" accept=".xlsx" (change)="onFileChange($event)" style="display:none">
        </div>
        <p *ngIf="selectedFile" class="file-chosen">
          <lucide-icon name="FileCheck" size="16"></lucide-icon>
          {{ selectedFile.name }}
        </p>
        <button class="btn-primary" [disabled]="!selectedFile || parsing" (click)="parseFile()">
          <lucide-icon *ngIf="!parsing" name="ArrowRight" size="18"></lucide-icon>
          <lucide-icon *ngIf="parsing" name="Loader2" size="18" class="spin"></lucide-icon>
          {{ parsing ? 'Lendo arquivo...' : 'Avançar para Preview' }}
        </button>
      </div>

      <!-- ── STEP 2: PREVIEW ─────────────────────────────── -->
      <div *ngIf="step === 'preview'" class="card preview-card">
        <!-- Badges de contagem -->
        <div class="preview-summary">
          <div class="summary-badge">
            <lucide-icon name="BookOpen" size="18" class="badge-icon"></lucide-icon>
            <strong>{{ parsedData?.cursos?.length || 0 }}</strong>
            <span>Cursos</span>
          </div>
          <div class="summary-badge">
            <lucide-icon name="List" size="18" class="badge-icon"></lucide-icon>
            <strong>{{ parsedData?.modulos?.length || 0 }}</strong>
            <span>Módulos</span>
          </div>
          <div class="summary-badge">
            <lucide-icon name="FileText" size="18" class="badge-icon"></lucide-icon>
            <strong>{{ parsedData?.conteudos?.length || 0 }}</strong>
            <span>Conteúdos</span>
          </div>
          <div class="summary-badge">
            <lucide-icon name="HelpCircle" size="18" class="badge-icon"></lucide-icon>
            <strong>{{ parsedData?.questoes?.length || 0 }}</strong>
            <span>Questões</span>
          </div>
          <div class="summary-badge">
            <lucide-icon name="Users" size="18" class="badge-icon"></lucide-icon>
            <strong>{{ parsedData?.turmas?.length || 0 }}</strong>
            <span>Turmas</span>
          </div>
          <div class="summary-badge">
            <lucide-icon name="UserPlus" size="18" class="badge-icon"></lucide-icon>
            <strong>{{ parsedData?.alunos?.length || 0 }}</strong>
            <span>Alunos</span>
          </div>
        </div>

        <!-- Tabelas de preview -->
        <div class="preview-body">

          <!-- Tabela de Cursos -->
          <div *ngIf="parsedData?.cursos?.length" class="preview-section">
            <h3>Cursos</h3>
            <table class="preview-table">
              <thead><tr><th>Título</th><th>Status</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of parsedData!.cursos">
                  <td>{{ row['titulo'] || row['Titulo'] || '—' }}</td>
                  <td><span class="badge" [class.badge-green]="(row['status']||row['Status']||'Ativo')==='Ativo'">{{ row['status'] || row['Status'] || 'Ativo' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tabela de Módulos -->
          <div *ngIf="parsedData?.modulos?.length" class="preview-section">
            <h3>Módulos</h3>
            <table class="preview-table">
              <thead><tr><th>Curso</th><th>Módulo</th><th>Ordem</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of parsedData!.modulos">
                  <td>{{ row['curso_titulo'] || row['Curso'] || '—' }}</td>
                  <td>{{ row['nome_modulo'] || row['Modulo'] || row['Nome'] || '—' }}</td>
                  <td>{{ row['ordem'] || row['Ordem'] || 1 }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tabela de Conteúdos -->
          <div *ngIf="parsedData?.conteudos?.length" class="preview-section">
            <h3>Conteúdos</h3>
            <table class="preview-table">
              <thead><tr><th>Título</th><th>Área</th><th>Curso</th><th>Módulo</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of parsedData!.conteudos">
                  <td>{{ row['titulo_tema'] || row['Titulo'] || '—' }}</td>
                  <td>{{ row['area_conhecimento'] || row['Area'] || '—' }}</td>
                  <td>{{ row['curso_titulo'] || row['Curso'] || '—' }}</td>
                  <td>{{ row['modulo'] || row['Modulo'] || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tabela de Questões -->
          <div *ngIf="parsedData?.questoes?.length" class="preview-section">
            <h3>Questões</h3>
            <table class="preview-table">
              <thead><tr><th>Título</th><th>Enunciado</th><th>Correta</th><th>Conteúdo</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of parsedData!.questoes">
                  <td>{{ row['titulo'] || row['Titulo'] || '—' }}</td>
                  <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ row['enunciado'] || row['Enunciado'] || '—' }}</td>
                  <td><span class="badge badge-green">{{ row['correta'] || row['Correta'] || '?' }}</span></td>
                  <td>{{ row['conteudo'] || row['Conteudo'] || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tabela de Turmas -->
          <div *ngIf="parsedData?.turmas?.length" class="preview-section">
            <h3>Turmas</h3>
            <table class="preview-table">
              <thead><tr><th>Nome da Turma</th><th>Curso Vinculado</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of parsedData!.turmas">
                  <td><strong>{{ row['nome_turma'] || row['Turma'] || row['Nome'] || '—' }}</strong></td>
                  <td>{{ row['curso_titulo'] || row['Curso'] || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tabela de Alunos -->
          <div *ngIf="parsedData?.alunos?.length" class="preview-section">
            <h3>Alunos</h3>
            <table class="preview-table">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Senha</th><th>Turma</th><th>CPF</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of parsedData!.alunos">
                  <td>{{ row['nome'] || row['Nome'] || '—' }}</td>
                  <td>{{ row['email'] || row['Email'] || '—' }}</td>
                  <td><span class="badge">••••••••</span></td>
                  <td>{{ row['turma'] || row['Turma'] || '—' }}</td>
                  <td>{{ row['cpf'] || row['CPF'] || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p *ngIf="!parsedData?.cursos?.length && !parsedData?.modulos?.length && !parsedData?.conteudos?.length && !parsedData?.questoes?.length && !parsedData?.turmas?.length && !parsedData?.alunos?.length" class="empty-msg">
            Nenhum dado encontrado. Verifique os nomes das abas: <strong>Cursos</strong>, <strong>Modulos</strong>, <strong>Conteudos</strong>, <strong>Questoes</strong>, <strong>Turmas</strong>, <strong>Alunos</strong>.
          </p>

        </div><!-- /preview-body -->

        <div class="form-actions">
          <button class="btn-secondary" (click)="step = 'upload'">
            <lucide-icon name="ArrowLeft" size="16"></lucide-icon>
            Voltar
          </button>
          <button class="btn-primary" [disabled]="importing" (click)="runImport()">
            <lucide-icon *ngIf="!importing" name="Zap" size="18"></lucide-icon>
            <lucide-icon *ngIf="importing" name="Loader2" size="18" class="spin"></lucide-icon>
            {{ importing ? 'Importando...' : 'Confirmar Importação' }}
          </button>
        </div>
      </div>

      <!-- ── OVERLAY DE PROGRESSO ──────────────────────── -->
      <div *ngIf="importing" class="progress-overlay">
        <div class="progress-card">
          <div class="progress-header">
            <lucide-icon name="Loader2" size="28" class="spin progress-icon"></lucide-icon>
            <div>
              <h3>Importando dados...</h3>
              <p class="progress-step-label">{{ progressStep }}</p>
            </div>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" [style.width.%]="progressPct"></div>
          </div>
          <div class="progress-footer">
            <span class="progress-stages">
              <span class="stage" [class.active]="progressStep.includes('Curso')">Cursos</span>
              <span class="stage-sep">›</span>
              <span class="stage" [class.active]="progressStep.includes('dulo')">Módulos</span>
              <span class="stage-sep">›</span>
              <span class="stage" [class.active]="progressStep.includes('onte')">Conteúdos</span>
              <span class="stage-sep">›</span>
              <span class="stage" [class.active]="progressStep.includes('uest')">Questões</span>
              <span class="stage-sep">›</span>
              <span class="stage" [class.active]="progressStep.includes('urma')">Turmas</span>
              <span class="stage-sep">›</span>
              <span class="stage" [class.active]="progressStep.includes('luno')">Alunos</span>
            </span>
            <span class="progress-pct">{{ progressPct }}%</span>
          </div>
        </div>
      </div>

      <!-- ── STEP 3: RESULT ──────────────────────────────── -->
      <div *ngIf="step === 'result'" class="card">
        <div class="result-header">
          <lucide-icon [name]="hasErrors ? 'AlertCircle' : 'CheckCircle'" size="32" [class.icon-ok]="!hasErrors" [class.icon-err]="hasErrors"></lucide-icon>
          <div>
            <h2>{{ hasErrors ? 'Importação concluída com avisos' : 'Importação concluída!' }}</h2>
            <p>{{ successCount }} itens criados com sucesso &bull; {{ errorCount }} com erro ou aviso.</p>
          </div>
        </div>

        <div class="result-log">
          <div *ngFor="let r of importLog" class="log-item" [class.log-ok]="r.type==='success'" [class.log-err]="r.type==='error'" [class.log-warn]="r.type==='warning'">
            {{ r.message }}
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" (click)="reset()">
            <lucide-icon name="RefreshCw" size="16"></lucide-icon>
            Nova Importação
          </button>
          <button class="btn-primary" routerLink="/admin/courses">
            <lucide-icon name="BookOpen" size="16"></lucide-icon>
            Ver Cursos
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      margin-left: 280px;
      height: 100vh;
      overflow-y: auto;
      box-sizing: border-box;
    }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--text-main); }
    .page-header p { color: var(--text-muted); margin-top: 0.25rem; }

    .btn-template { display: flex; align-items: center; gap: 8px; padding: 0.7rem 1.2rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-main); font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.875rem; }
    .btn-template:hover { background: rgba(139,92,246,0.08); border-color: var(--primary); color: var(--primary); }
    .btn-primary { display: flex; align-items: center; gap: 8px; background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { display: flex; align-items: center; gap: 8px; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; }

    /* Stepper */
    .stepper { display: flex; align-items: center; margin-bottom: 2rem; }
    .step { display: flex; align-items: center; gap: 8px; }
    .step-circle { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-card); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.3s; }
    .step.active .step-circle { background: var(--primary); border-color: var(--primary); color: white; }
    .step.done .step-circle { background: #22c55e; border-color: #22c55e; color: white; }
    .step span { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
    .step.active span, .step.done span { color: var(--text-main); }
    .step-line { flex: 1; height: 2px; background: var(--border); margin: 0 1rem; }

    /* Card */
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .preview-card { /* sem max-height — deixa o container rolar */ }

    /* Drop Zone */
    .drop-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 3rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: all 0.2s; text-align: center; }
    .drop-zone:hover { border-color: var(--primary); background: rgba(139,92,246,0.04); }
    .icon-upload { color: var(--primary); opacity: 0.6; }
    .drop-title { font-size: 1.05rem; font-weight: 600; color: var(--text-main); }
    .drop-hint { font-size: 0.85rem; color: var(--text-muted); }
    .file-chosen { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #22c55e; font-weight: 500; }

    /* Spinner */
    .spin { animation: spinAnim 1s linear infinite; display: inline-block; }
    @keyframes spinAnim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    /* Preview */
    .preview-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }
    .summary-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(139,92,246,0.07);
      border: 1px solid rgba(139,92,246,0.15);
      border-radius: 12px;
      padding: 0.85rem 1rem;
    }
    .badge-icon { color: var(--primary); opacity: 0.8; flex-shrink: 0; }
    .summary-badge strong { font-size: 1.4rem; font-weight: 800; color: var(--primary); line-height: 1; }
    .summary-badge span { font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 2px; }

    .preview-body { display: flex; flex-direction: column; gap: 1.5rem; overflow-y: visible; }

    .preview-section h3 { font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem; }
    .preview-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .preview-table th { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); }
    .preview-table td { padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.04); color: var(--text-main); }
    .badge { display: inline-block; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: rgba(239,68,68,0.12); color: #ef4444; }
    .badge-green { background: rgba(34,197,94,0.12); color: #22c55e; }
    .empty-msg { text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 2rem 0; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; }

    /* Result */
    .result-header { display: flex; align-items: center; gap: 1rem; }
    .result-header h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .result-header p { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
    .icon-ok { color: #22c55e; }
    .icon-err { color: #f59e0b; }
    .result-log { background: var(--bg-main); border: 1px solid var(--border); border-radius: 10px; padding: 1rem; max-height: 360px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .log-item { font-size: 0.82rem; padding: 0.35rem 0.5rem; border-radius: 6px; color: var(--text-muted); font-family: monospace; }
    .log-ok { color: #22c55e; background: rgba(34,197,94,0.05); }
    .log-err { color: #ef4444; background: rgba(239,68,68,0.05); }
    .log-warn { color: #f59e0b; background: rgba(245,158,11,0.05); }

    /* Progress Overlay */
    .progress-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    }
    .progress-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2rem 2.5rem;
      width: 520px;
      max-width: 92vw;
      display: flex; flex-direction: column; gap: 1.5rem;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    }
    .progress-header { display: flex; align-items: center; gap: 1rem; }
    .progress-icon { color: var(--primary); }
    .progress-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .progress-step-label { font-size: 0.82rem; color: var(--text-muted); margin: 4px 0 0; }
    .progress-bar-track { height: 10px; background: rgba(139,92,246,0.12); border-radius: 99px; overflow: hidden; }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), #a78bfa);
      border-radius: 99px;
      transition: width 0.4s ease;
    }
    .progress-footer { display: flex; align-items: center; justify-content: space-between; }
    .progress-stages { display: flex; align-items: center; gap: 4px; }
    .stage { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; transition: color 0.2s; }
    .stage.active { color: var(--primary); font-weight: 700; }
    .stage-sep { color: var(--border); font-size: 0.75rem; }
    .progress-pct { font-size: 1rem; font-weight: 800; color: var(--primary); min-width: 40px; text-align: right; }
  `]
})
export class ExcelImportComponent {
  private importService = inject(ExcelImportService);
  private toastService = inject(ToastService);

  step: Step = 'upload';
  selectedFile: File | null = null;
  parsedData: ExcelImportData | null = null;
  importLog: ImportResult[] = [];
  parsing = false;
  importing = false;
  progressStep = '';
  progressPct = 0;

  get successCount() { return this.importLog.filter(r => r.type === 'success').length; }
  get errorCount() { return this.importLog.filter(r => r.type !== 'success').length; }
  get hasErrors() { return this.errorCount > 0; }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      this.selectedFile = file;
    } else {
      this.toastService.error('Apenas arquivos .xlsx são aceitos.');
    }
  }

  async parseFile() {
    if (!this.selectedFile) return;
    this.parsing = true;
    try {
      this.parsedData = await this.importService.parseFile(this.selectedFile);
      this.step = 'preview';
    } catch {
      this.toastService.error('Erro ao ler o arquivo. Verifique se é um .xlsx válido.');
    } finally {
      this.parsing = false;
    }
  }

  async runImport() {
    if (!this.parsedData) return;
    this.importing = true;
    this.progressStep = 'Preparando...';
    this.progressPct = 0;
    try {
      this.importLog = await this.importService.importData(
        this.parsedData,
        (step, current, total) => {
          this.progressStep = step;
          this.progressPct = total > 0 ? Math.round((current / total) * 100) : 0;
        }
      );
      this.progressPct = 100;
      this.step = 'result';
    } catch {
      this.toastService.error('Erro inesperado durante a importação.');
    } finally {
      this.importing = false;
    }
  }

  downloadTemplate() {
    this.importService.downloadTemplate();
  }

  reset() {
    this.step = 'upload';
    this.selectedFile = null;
    this.parsedData = null;
    this.importLog = [];
  }
}
