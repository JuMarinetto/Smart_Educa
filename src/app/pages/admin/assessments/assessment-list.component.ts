import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { AssessmentService } from '../../../core/services/assessment.service';
import { QuestionService } from '../../../core/services/question.service';
import { KnowledgeService } from '../../../core/services/knowledge.service';
import { CourseService } from '../../../core/services/course.service';
import { Assessment } from '../../../core/models/assessment.model';
import { KnowledgeArea } from '../../../core/models/knowledge-area.model';
import { Course } from '../../../core/models/course.model';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

/** Representa um conteúdo extraído das questões vinculadas */
interface ContentRule {
  id: string;
  titulo: string;
  notaMinima: number;
}

@Component({
  selector: 'app-assessment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule, DataTableComponent, UiModalComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Gestão de Avaliações</h1>
          <p>Crie e gerencie as provas, testes e simulados.</p>
        </div>
        <button class="btn-primary" (click)="openModal()">
          <lucide-icon name="Plus" size="18"></lucide-icon>
          Nova Avaliação
        </button>
      </header>

      <app-data-table
        [title]="'Todas as Avaliações'"
        [columns]="columns"
        [data]="assessments"
        (edit)="openModal($event)"
        (delete)="confirmDelete($event)">
      </app-data-table>

      <app-ui-modal title="Confirmar Exclusão" [(isOpen)]="isDeleteModalOpen" width="500px">
        <div class="modal-body" *ngIf="assessmentToDelete">
          <p>Tem certeza que deseja excluir a avaliação <strong>{{ assessmentToDelete.nome }}</strong>?</p>
          <p style="font-size: 0.85rem; color: var(--danger); margin-top: 10px;">
            ⚠️ ATENÇÃO: Todos os históricos de tentativas dos alunos desta avaliação também serão excluídos. Esta ação não pode ser desfeita.
          </p>
          <div class="form-actions" style="margin-top: 2rem;">
            <button type="button" class="btn-secondary" (click)="cancelDelete()">Cancelar</button>
            <button type="button" class="btn-danger" (click)="executeDelete()">Sim, Excluir Avaliação</button>
          </div>
        </div>
      </app-ui-modal>

      <!-- MODAL: Metadados da Avaliação -->
      <app-ui-modal [title]="editingAssessment ? 'Editar Avaliação' : 'Nova Avaliação'" [(isOpen)]="isModalOpen">
        <form (submit)="saveAssessment($event)" class="admin-form">
          <div class="form-alert form-alert-error" *ngIf="showError">
            <lucide-icon name="AlertCircle" size="18"></lucide-icon>
            Preencha todos os campos obrigatórios (*) para continuar.
          </div>

          <div class="form-group">
            <label>Nome da Avaliação <span class="required-star">*</span></label>
            <input type="text" [(ngModel)]="assessmentForm.nome" name="nome" required
                   [class.invalid-input]="showError && !assessmentForm.nome"
                   placeholder="Ex: Prova Final - Lógica de Programação">
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Tipo <span class="required-star">*</span></label>
              <select [(ngModel)]="assessmentForm.tipo" name="tipo" required>
                <option value="DIAGNOSTICA">Diagnóstica</option>
                <option value="FORMATIVA">Formativa</option>
                <option value="SOMATIVA">Somativa</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label>Status <span class="required-star">*</span></label>
              <select [(ngModel)]="assessmentForm.status" name="status" required>
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADA">Publicada</option>
                <option value="ENCERRADA">Encerrada</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>Nota Total <span class="required-star">*</span></label>
              <input type="number" [(ngModel)]="assessmentForm.nota_total" name="nota_total" required min="0">
            </div>

            <div class="form-group flex-1">
              <label>Duração (minutos)</label>
              <input type="number" [(ngModel)]="assessmentForm.duracao" name="duracao" min="0" placeholder="Ex: 60">
            </div>
          </div>

          <div class="form-group">
            <label>Curso Vinculado</label>
            <select [(ngModel)]="assessmentForm.id_curso" name="id_curso">
              <option value="">Nenhum curso específico</option>
              <option *ngFor="let course of courses" [value]="course.id">{{ course.titulo }}</option>
            </select>
          </div>

          <div class="form-row align-center mt-2">
            <div class="form-group flex-1">
              <label>Modo de Criação</label>
              <select [(ngModel)]="assessmentForm.modo_criacao" name="modo_criacao">
                <option value="MANUAL">Manual</option>
                <option value="IA">Inteligência Artificial (IA)</option>
              </select>
            </div>

            <div class="form-group checkbox-group flex-1">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="assessmentForm.cronometro" name="cronometro">
                Ativar Cronômetro
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editingAssessment ? 'Salvar e Gerenciar Questões' : 'Criar e Adicionar Questões' }}</button>
          </div>
        </form>
      </app-ui-modal>

      <!-- MODAL: Gerenciar Questões -->
      <app-ui-modal title="Gerenciar Questões da Avaliação" [(isOpen)]="isQuestionsModalOpen" width="900px">
        <div class="questions-manager">
          <div class="qm-header">
            <h3>{{ currentAssessmentName }}</h3>
            <span class="qm-badge">{{ linkedQuestions.length }} questão(ões) vinculada(s)</span>
          </div>

          <!-- Linked Questions -->
          <div class="qm-section">
            <h4>Questões Vinculadas</h4>
            <div class="qm-list" *ngIf="linkedQuestions.length > 0">
              <div class="qm-item linked" *ngFor="let lq of linkedQuestions; let i = index">
                <div class="qm-item-info">
                  <span class="qm-num">{{ i + 1 }}.</span>
                  <div>
                    <strong>{{ lq.questions?.titulo || lq.questions?.codigo || 'Questão' }}</strong>
                    <p class="qm-enunciado">{{ lq.questions?.enunciado | slice:0:100 }}{{ lq.questions?.enunciado?.length > 100 ? '...' : '' }}</p>
                    <span class="qm-content-tag" *ngIf="lq.questions?.contents?.titulo_tema">
                      <lucide-icon name="BookOpen" size="12"></lucide-icon>
                      {{ lq.questions?.contents?.titulo_tema }}
                    </span>
                  </div>
                </div>
                <button class="btn-unlink" (click)="unlinkQuestion(lq.id_questao)">
                  <lucide-icon name="X" size="16"></lucide-icon>
                  Remover
                </button>
              </div>
            </div>
            <p class="qm-empty" *ngIf="linkedQuestions.length === 0">Nenhuma questão vinculada ainda.</p>
          </div>

          <!-- Available Questions to Add -->
          <div class="qm-section">
            <div class="qm-filters">
              <div class="qm-search flex-1">
                <lucide-icon name="Search" size="16"></lucide-icon>
                <input type="text" [ngModel]="questionSearch" (ngModelChange)="questionSearch = $event" name="qsearch" placeholder="Buscar por título ou enunciado...">
              </div>
              <div class="qm-filter-select">
                <select [(ngModel)]="selectedAreaId" name="areaFilter">
                  <option value="">Todas as Áreas</option>
                  <option *ngFor="let area of areas" [value]="area.id">{{ area.area_conhecimento }}</option>
                </select>
              </div>
            </div>
            <div class="qm-list available-list" *ngIf="filteredAvailableQuestions.length > 0">
              <div class="qm-item available" *ngFor="let q of filteredAvailableQuestions">
                <div class="qm-item-info">
                  <div>
                    <strong>{{ q.titulo || q.codigo || 'Questão' }}</strong>
                    <p class="qm-enunciado">{{ q.enunciado | slice:0:100 }}{{ q.enunciado?.length > 100 ? '...' : '' }}</p>
                  </div>
                </div>
                <button class="btn-link" (click)="linkQuestion(q.id)">
                  <lucide-icon name="Plus" size="16"></lucide-icon>
                  Adicionar
                </button>
              </div>
            </div>
            <p class="qm-empty" *ngIf="filteredAvailableQuestions.length === 0">
              {{ allQuestions.length === 0 ? 'Nenhuma questão cadastrada no banco.' : 'Todas as questões já estão vinculadas ou nenhuma corresponde à busca.' }}
            </p>
          </div>

          <!-- ===== NOVA SEÇÃO: Regras por Conteúdo ===== -->
          <div class="qm-section rules-section" *ngIf="contentRules.length > 0">
            <div class="rules-header">
              <h4>
                <lucide-icon name="Target" size="16"></lucide-icon>
                Nota Mínima por Conteúdo
              </h4>
              <p class="rules-hint">Defina a pontuação mínima que o aluno deve atingir em cada conteúdo para ser aprovado.</p>
            </div>

            <div class="rules-grid">
              <div class="rule-card" *ngFor="let rule of contentRules">
                <div class="rule-card-info">
                  <lucide-icon name="BookOpen" size="16" class="rule-icon"></lucide-icon>
                  <span class="rule-title">{{ rule.titulo }}</span>
                </div>
                <div class="rule-input-group">
                  <label>Mínimo</label>
                  <input
                    type="number"
                    [(ngModel)]="rule.notaMinima"
                    [name]="'rule_' + rule.id"
                    min="0"
                    max="100"
                    placeholder="0"
                    class="rule-input">
                  <span class="rule-unit">pts</span>
                </div>
              </div>
            </div>

            <div class="rules-actions">
              <button type="button" class="btn-save-rules" (click)="saveContentRules()" [disabled]="savingRules">
                <lucide-icon [name]="savingRules ? 'Loader' : 'Save'" size="16"></lucide-icon>
                {{ savingRules ? 'Salvando...' : 'Salvar Regras' }}
              </button>
            </div>
          </div>

          <div class="qm-section rules-empty" *ngIf="contentRules.length === 0 && linkedQuestions.length > 0">
            <lucide-icon name="Info" size="16"></lucide-icon>
            Nenhuma questão vinculada possui conteúdo associado. Associe conteúdos às questões para configurar notas mínimas.
          </div>

          <div class="form-actions">
            <button type="button" class="btn-primary" (click)="closeQuestionsModal()">Concluído</button>
          </div>
        </div>
      </app-ui-modal>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; border: none; cursor: pointer; }
    .btn-secondary { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; }
    .btn-danger { background: var(--danger); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-danger:hover { opacity: 0.9; }
    .admin-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .align-center { align-items: center; }
    .mt-2 { margin-top: 0.5rem; }

    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .form-group input, .form-group select { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); }
    .invalid-input { border-color: #ef4444 !important; }

    .checkbox-group { display: flex; align-items: center; margin-top: 1.5rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem; color: var(--text-main) !important; font-weight: 500 !important; }
    .checkbox-label input { width: 1.2rem; height: 1.2rem; accent-color: var(--primary); cursor: pointer; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }

    /* ====== QUESTIONS MANAGER ====== */
    .questions-manager { display: flex; flex-direction: column; gap: 1.5rem; }
    .qm-header { display: flex; justify-content: space-between; align-items: center; }
    .qm-header h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .qm-badge { background: rgba(139,92,246,0.15); color: var(--primary); padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }

    .qm-section h4 { font-size: 0.9rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }
    .qm-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .available-list { max-height: 300px; overflow-y: auto; }

    .qm-item {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border);
      background: var(--bg-card);
    }
    .qm-item.linked { border-left: 3px solid var(--primary); }
    .qm-item.available { border-left: 3px solid rgba(255,255,255,0.1); }
    .qm-item.available:hover { border-left-color: var(--success); background: rgba(34,197,94,0.03); }

    .qm-item-info { display: flex; align-items: flex-start; gap: 0.5rem; flex: 1; min-width: 0; }
    .qm-num { font-weight: 700; color: var(--primary); min-width: 24px; }
    .qm-item-info strong { font-size: 0.9rem; display: block; }
    .qm-enunciado { font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 500px; }

    .qm-content-tag {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: var(--primary); background: rgba(139,92,246,0.1);
      padding: 0.15rem 0.5rem; border-radius: 12px; margin-top: 0.3rem;
    }

    .btn-unlink { display: flex; align-items: center; gap: 4px; background: none; border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .btn-unlink:hover { background: rgba(239,68,68,0.1); }
    .btn-link { display: flex; align-items: center; gap: 4px; background: none; border: 1px solid rgba(34,197,94,0.3); color: #22c55e; padding: 0.35rem 0.7rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .btn-link:hover { background: rgba(34,197,94,0.1); }

    .qm-filters { display: flex; gap: 0.75rem; margin-bottom: 0.75rem; }
    .qm-search { display: flex; align-items: center; gap: 8px; padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-muted); }
    .qm-search input { border: none; background: none; color: var(--text-main); flex: 1; outline: none; font-size: 0.9rem; }

    .qm-filter-select select {
      padding: 0.6rem 1rem; border: 1px solid var(--border); border-radius: 8px;
      background: var(--bg-main); color: var(--text-main); font-size: 0.9rem; height: 100%;
      min-width: 200px; outline: none;
    }

    .qm-empty { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1.5rem; }

    /* ====== RULES SECTION ====== */
    .rules-section {
      background: rgba(139,92,246,0.04);
      border: 1px solid rgba(139,92,246,0.2);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .rules-header { margin-bottom: 1rem; }
    .rules-header h4 { color: var(--primary) !important; }
    .rules-hint { font-size: 0.82rem; color: var(--text-muted); margin: 0.35rem 0 0; }

    .rules-grid { display: flex; flex-direction: column; gap: 0.6rem; }
    .rule-card {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      background: var(--bg-card); padding: 0.75rem 1rem;
      border-radius: 8px; border: 1px solid var(--border);
    }
    .rule-card-info { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
    .rule-icon { color: var(--primary); flex-shrink: 0; }
    .rule-title { font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .rule-input-group { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
    .rule-input-group label { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }
    .rule-input {
      width: 70px; padding: 0.4rem 0.6rem; border: 1px solid var(--border);
      border-radius: 6px; background: var(--bg-main); color: var(--text-main);
      text-align: right; font-size: 0.9rem; font-weight: 700;
    }
    .rule-input:focus { border-color: var(--primary); outline: none; }
    .rule-unit { font-size: 0.8rem; color: var(--text-muted); }

    .rules-actions { margin-top: 1rem; display: flex; justify-content: flex-end; }
    .btn-save-rules {
      display: flex; align-items: center; gap: 6px;
      background: var(--primary); color: white;
      padding: 0.55rem 1.25rem; border-radius: 8px;
      border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem;
    }
    .btn-save-rules:hover { opacity: 0.9; }
    .btn-save-rules:disabled { opacity: 0.6; cursor: not-allowed; }

    .rules-empty {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; color: var(--text-muted);
      padding: 0.75rem 1rem; border-radius: 8px;
      background: var(--bg-card); border: 1px dashed var(--border);
    }
  `]
})
export class AssessmentListComponent implements OnInit {
  private assessmentService = inject(AssessmentService);
  private questionService = inject(QuestionService);
  private knowledgeService = inject(KnowledgeService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastService);

  assessments: Assessment[] = [];
  areas: KnowledgeArea[] = [];
  courses: Course[] = [];

  // --- Metadata Modal ---
  isModalOpen = false;
  editingAssessment: Assessment | null = null;
  assessmentForm: any = {
    nome: '', tipo: 'DIAGNOSTICA', status: 'RASCUNHO',
    nota_total: 10, duracao: 60, modo_criacao: 'MANUAL', cronometro: true, id_curso: null
  };
  showError = false;

  isDeleteModalOpen = false;
  assessmentToDelete: Assessment | null = null;

  // --- Questions Modal ---
  isQuestionsModalOpen = false;
  currentAssessmentId = '';
  currentAssessmentName = '';
  linkedQuestions: any[] = [];
  allQuestions: any[] = [];
  questionSearch = '';
  selectedAreaId = '';

  // --- Content Rules ---
  contentRules: ContentRule[] = [];
  savingRules = false;

  columns: TableColumn[] = [
    { key: 'nome', label: 'Nome da Avaliação' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'status', label: 'Status' },
    { key: 'nota_total', label: 'Valor' }
  ];

  get filteredAvailableQuestions() {
    const linkedIds = new Set(this.linkedQuestions.map(lq => lq.id_questao));
    let available = this.allQuestions.filter(q => !linkedIds.has(q.id));

    if (this.selectedAreaId) {
      available = available.filter(q => q.id_area_conhecimento === this.selectedAreaId);
    }

    if (this.questionSearch.trim()) {
      const s = this.questionSearch.toLowerCase();
      available = available.filter(q =>
        (q.titulo || '').toLowerCase().includes(s) ||
        (q.enunciado || '').toLowerCase().includes(s) ||
        (q.codigo || '').toLowerCase().includes(s)
      );
    }
    return available;
  }

  ngOnInit() {
    this.refresh();
    this.knowledgeService.getAreas().subscribe(data => this.areas = data);
    this.courseService.getCourses().subscribe(data => this.courses = data);
  }

  refresh() {
    this.assessmentService.getAllAssessments().subscribe(data => {
      this.assessments = data;
    });
  }

  // ====== METADATA MODAL ======
  openModal(assessment?: Assessment) {
    this.showError = false;
    if (assessment) {
      this.editingAssessment = assessment;
      this.assessmentForm = { ...assessment };
    } else {
      this.editingAssessment = null;
      this.assessmentForm = {
        nome: '', tipo: 'DIAGNOSTICA', status: 'RASCUNHO',
        nota_total: 10, duracao: 60, modo_criacao: 'MANUAL', cronometro: true, id_curso: null
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.showError = false;
  }

  async saveAssessment(event: Event) {
    event.preventDefault();
    this.showError = false;
    const form = this.assessmentForm as any;

    if (!form.nome || !form.tipo || !form.status || form.nota_total === undefined) {
      this.showError = true;
      return;
    }

    const payload: Partial<Assessment> = {};
    payload.nome = form.nome;
    payload.tipo = form.tipo;
    payload.status = form.status;
    payload.nota_total = form.nota_total;
    payload.duracao = form.duracao || null;
    payload.modo_criacao = form.modo_criacao;
    payload.cronometro = form.cronometro ? true : false;
    payload.id_curso = form.id_curso || null;

    try {
      if (this.editingAssessment) {
        const response = await this.assessmentService.updateAssessment(this.editingAssessment.id, payload);
        if (response.error) {
          this.toastService.error('Erro ao salvar: ' + response.error.message);
          return;
        }
        this.toastService.success('Avaliação atualizada!');
        this.closeModal();
        this.refresh();
        if (form.modo_criacao === 'MANUAL') {
          this.openQuestionsModal(this.editingAssessment.id, form.nome, this.editingAssessment);
        }
      } else {
        const response = await this.assessmentService.createAssessment(payload);
        if (response.error) {
          this.toastService.error('Erro ao criar: ' + response.error.message);
          return;
        }
        this.toastService.success('Avaliação criada!');
        this.closeModal();
        this.refresh();
        if (form.modo_criacao === 'MANUAL' && response.data) {
          this.openQuestionsModal(response.data.id, form.nome, response.data);
        }
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      this.toastService.error('Erro inesperado ao salvar avaliação.');
    }
  }

  confirmDelete(assessment: Assessment) {
    this.assessmentToDelete = assessment;
    this.isDeleteModalOpen = true;
  }

  cancelDelete() {
    this.isDeleteModalOpen = false;
    this.assessmentToDelete = null;
  }

  async executeDelete() {
    if (!this.assessmentToDelete) return;

    try {
      const { error } = await this.assessmentService.deleteAssessment(this.assessmentToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir avaliação: ' + (error as any).message);
      } else {
        this.toastService.success('Avaliação excluída com sucesso!');
        this.refresh();
      }
    } catch (error: any) {
      console.error('Erro inesperado ao excluir:', error);
      this.toastService.error('Erro inesperado ao excluir avaliação.');
    } finally {
      this.cancelDelete();
    }
  }

  // ====== QUESTIONS MANAGER MODAL ======
  openQuestionsModal(assessmentId: string, assessmentName: string, assessment?: Assessment) {
    this.currentAssessmentId = assessmentId;
    this.currentAssessmentName = assessmentName;
    this.questionSearch = '';
    this.selectedAreaId = '';
    this.contentRules = [];
    // Pré-carregar regras salvas da avaliação
    if (assessment?.regras_nota_minima_conteudo) {
      this._pendingRules = assessment.regras_nota_minima_conteudo;
    } else {
      this._pendingRules = {};
    }
    this.loadLinkedQuestions();
    this.loadAllQuestions();
    this.isQuestionsModalOpen = true;
  }

  closeQuestionsModal() {
    this.isQuestionsModalOpen = false;
  }

  /** Mapa de regras carregadas da avaliação, aplicado após carregar questões */
  private _pendingRules: Record<string, number> = {};

  loadLinkedQuestions() {
    this.assessmentService.getAssessmentQuestions(this.currentAssessmentId).subscribe(data => {
      this.linkedQuestions = data;
      this._buildContentRules();
    });
  }

  loadAllQuestions() {
    this.questionService.getQuestions().subscribe(data => {
      this.allQuestions = data;
    });
  }

  /** Extrai conteúdos únicos das questões vinculadas e constrói a lista de regras */
  private _buildContentRules() {
    const seen = new Set<string>();
    const rules: ContentRule[] = [];

    for (const lq of this.linkedQuestions) {
      const q = lq.questions;
      if (!q?.id_conteudo || !q?.contents?.titulo_tema) continue;
      if (seen.has(q.id_conteudo)) continue;
      seen.add(q.id_conteudo);
      rules.push({
        id: q.id_conteudo,
        titulo: q.contents.titulo_tema,
        notaMinima: this._pendingRules[q.id_conteudo] ?? 0
      });
    }
    this.contentRules = rules;
  }

  async linkQuestion(questionId: string) {
    const { error } = await this.assessmentService.linkQuestionsToAssessment(this.currentAssessmentId, [questionId]);
    if (error) {
      this.toastService.error('Erro ao vincular questão: ' + error.message);
    } else {
      this.toastService.success('Questão vinculada!');
      this.loadLinkedQuestions();
    }
  }

  async unlinkQuestion(questionId: string) {
    const { error } = await this.assessmentService.unlinkQuestionFromAssessment(this.currentAssessmentId, questionId);
    if (error) {
      this.toastService.error('Erro ao remover: ' + error.message);
    } else {
      this.toastService.success('Questão removida!');
      this.loadLinkedQuestions();
    }
  }

  /** Salva as regras de nota mínima por conteúdo */
  async saveContentRules() {
    this.savingRules = true;
    const regras: Record<string, number> = {};
    for (const rule of this.contentRules) {
      if (rule.notaMinima > 0) {
        regras[rule.id] = rule.notaMinima;
      }
    }
    try {
      const { error } = await this.assessmentService.updateAssessmentRules(
        this.currentAssessmentId,
        regras
      );
      if (error) {
        this.toastService.error('Erro ao salvar regras: ' + error.message);
      } else {
        this.toastService.success('Regras salvas com sucesso!');
        this._pendingRules = regras;
      }
    } catch (e: any) {
      this.toastService.error('Erro inesperado ao salvar regras.');
    } finally {
      this.savingRules = false;
    }
  }
}
