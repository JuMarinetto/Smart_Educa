import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { TreeViewComponent } from '../../../shared/components/tree-view/tree-view.component';
import { KnowledgeService } from '../../../core/services/knowledge.service';
import { KnowledgeArea } from '../../../core/models/knowledge-area.model';
import { Content } from '../../../core/models/content.model';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ViewChild, ElementRef } from '@angular/core';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html.pipe';
import { QuestionService } from '../../../core/services/question.service';
import { Question, Alternative } from '../../../core/models/question.model';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, UiCardComponent, TreeViewComponent, DataTableComponent, UiModalComponent, SafeHtmlPipe],
  template: `
    <div class="container-fluid">
      <div class="sidebar-tree">
        <div class="sidebar-header">
          <h3>Áreas</h3>
          <button class="btn-icon-primary" (click)="openAreaModal()" title="Nova Área">
            <lucide-icon name="Plus" size="16"></lucide-icon>
            Adicionar
          </button>
        </div>
        <app-tree-view 
          [nodes]="areas" 
          [selectedId]="selectedArea?.id || null"
          (select)="onAreaSelect($event)"
          (edit)="onAreaEdit($event)"
          (delete)="onAreaDelete($event)">
        </app-tree-view>
      </div>

      <div class="content-main">
        <header class="page-header">
          <div>
            <h1>Biblioteca de Estudos</h1>
            <p *ngIf="selectedArea">Área: <strong>{{selectedArea.area_conhecimento}}</strong></p>
            <p *ngIf="!selectedArea">Selecione uma área na árvore para gerenciar conteúdos e questões.</p>
          </div>
          
          <div class="header-actions" *ngIf="selectedArea?.permite_conteudo">
            <button class="btn-primary" *ngIf="activeTab === 'contents'" (click)="openModal()">
              <lucide-icon name="Plus" size="18"></lucide-icon>
              Novo Conteúdo
            </button>
            <button class="btn-primary" *ngIf="activeTab === 'questions'" (click)="openQuestionModal()">
              <lucide-icon name="Plus" size="18"></lucide-icon>
              Nova Questão
            </button>
          </div>
        </header>

        <div class="tabs-container" *ngIf="selectedArea?.permite_conteudo">
          <button class="tab-btn" [class.active]="activeTab === 'contents'" (click)="setTab('contents')">
            <lucide-icon name="FileText" size="16"></lucide-icon>
            Conteúdos
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'questions'" (click)="setTab('questions')">
            <lucide-icon name="PenTool" size="16"></lucide-icon>
            Banco de Questões
          </button>
        </div>

        <div class="alert-info" *ngIf="selectedArea && !selectedArea.permite_conteudo">
          <lucide-icon name="Lock" size="18"></lucide-icon>
          Esta área é apenas estrutural. Selecione uma sub-área que permita conteúdo.
        </div>

        <app-data-table 
          *ngIf="selectedArea?.permite_conteudo && activeTab === 'contents'"
          [title]="'Conteúdos de ' + selectedArea?.area_conhecimento"
          [columns]="columns"
          [data]="contents"
          (edit)="openModal($event)"
          (delete)="confirmDeleteContent($event)">
        </app-data-table>

        <app-data-table 
          *ngIf="selectedArea?.permite_conteudo && activeTab === 'questions'"
          [title]="'Questões de ' + selectedArea?.area_conhecimento"
          [columns]="questionColumns"
          [data]="questions"
          (edit)="openQuestionModal($event)"
          (delete)="confirmDeleteQuestion($event)">
        </app-data-table>

        <!-- Modais de Deleção -->
        <app-ui-modal title="Confirmar Exclusão de Conteúdo" [(isOpen)]="isDeleteContentModalOpen" width="500px">
          <div class="modal-body" *ngIf="contentToDelete">
            <p>Tem certeza que deseja excluir o conteúdo <strong>{{ contentToDelete.titulo_tema }}</strong>?</p>
            <div class="form-actions" style="margin-top: 2rem;">
              <button type="button" class="btn-secondary" (click)="cancelDeleteContent()">Cancelar</button>
              <button type="button" class="btn-danger" (click)="executeDeleteContent()">Sim, Excluir</button>
            </div>
          </div>
        </app-ui-modal>

        <app-ui-modal title="Confirmar Exclusão de Questão" [(isOpen)]="isDeleteQuestionModalOpen" width="500px">
          <div class="modal-body" *ngIf="questionToDelete">
            <p>Tem certeza que deseja excluir a questão <strong>{{ questionToDelete.titulo || questionToDelete.codigo }}</strong>?</p>
            <div class="form-actions" style="margin-top: 2rem;">
              <button type="button" class="btn-secondary" (click)="cancelDeleteQuestion()">Cancelar</button>
              <button type="button" class="btn-danger" (click)="executeDeleteQuestion()">Sim, Excluir</button>
            </div>
          </div>
        </app-ui-modal>

        <app-ui-modal title="Confirmar Exclusão de Área" [(isOpen)]="isDeleteAreaModalOpen" width="500px">
          <div class="modal-body" *ngIf="areaToDelete">
            <p>Tem certeza que deseja excluir a área <strong>{{ areaToDelete.area_conhecimento }}</strong>?</p>
            <p style="font-size: 0.85rem; color: var(--danger); margin-top: 10px;">
              ⚠️ ATENÇÃO: Todos os conteúdos e questões desta área também serão excluídos.
            </p>
            <div class="form-actions" style="margin-top: 2rem;">
              <button type="button" class="btn-secondary" (click)="cancelDeleteArea()">Cancelar</button>
              <button type="button" class="btn-danger" (click)="executeDeleteArea()">Sim, Excluir Área</button>
            </div>
          </div>
        </app-ui-modal>

        <app-ui-modal [title]="editingContent ? 'Editar Conteúdo' : 'Novo Conteúdo'" [(isOpen)]="isModalOpen" width="800px">
          <form (submit)="saveContent($event)" class="admin-form">
            <div class="form-alert form-alert-error" *ngIf="showError">
              <lucide-icon name="AlertCircle" size="18"></lucide-icon>
              Preencha todos os campos obrigatórios (*) para continuar.
            </div>
            <div class="form-group">
              <label>Título do Tema <span class="required-star">*</span></label>
              <input type="text" [(ngModel)]="contentForm.titulo_tema" name="titulo_tema" required 
                     [class.invalid-input]="showError && !contentForm.titulo_tema"
                     placeholder="Ex: Introdução à LGPD">
              <small class="error-hint" *ngIf="showError && !contentForm.titulo_tema">O título é obrigatório.</small>
            </div>

            <div class="form-group">
              <label>Descrição Curta <span class="required-star">*</span></label>
              <input type="text" [(ngModel)]="contentForm.descricao" name="descricao" required 
                     [class.invalid-input]="showError && !contentForm.descricao"
                     placeholder="Resumo do conteúdo">
              <small class="error-hint" *ngIf="showError && !contentForm.descricao">A descrição é obrigatória.</small>
            </div>
            
            <div class="form-group">
              <label>Link do YouTube (Opcional)</label>
              <input type="text" [(ngModel)]="contentForm.video_url" name="video_url" 
                     placeholder="Ex: https://www.youtube.com/watch?v=...">
              <small class="hint">Se preenchido, um botão de vídeo será exibido para os alunos.</small>
            </div>
            
            <div class="form-group">
              <div class="editor-header">
                <label>Conteúdo HTML</label>
                <div class="editor-tabs">
                  <button type="button" [class.active]="!isPreviewMode" (click)="isPreviewMode = false">Editar</button>
                  <button type="button" [class.active]="isPreviewMode" (click)="isPreviewMode = true">Visualizar</button>
                </div>
              </div>

              <div class="rich-editor" *ngIf="!isPreviewMode">
                <div class="toolbar">
                  <button type="button" class="tool" (click)="applyTag('b')" title="Negrito">B</button>
                  <button type="button" class="tool" (click)="applyTag('i')" title="Itálico">I</button>
                  <button type="button" class="tool" (click)="insertLink()" title="Inserir Link">Link</button>
                  <button type="button" class="tool" (click)="insertVideo()" title="Inserir Vídeo (YouTube)">Video</button>
                </div>
                <textarea #editorTextarea [(ngModel)]="contentForm.conteudo_html" name="conteudo_html" placeholder="Escreva seu conteúdo aqui..."></textarea>
              </div>

              <div class="preview-container" *ngIf="isPreviewMode" [innerHTML]="contentForm.conteudo_html | safeHtml">
              </div>
              <small class="hint">Dica: Embeds de vídeo do YouTube/Vimeo funcionam via iframe no modo HTML.</small>
            </div>

            <div class="form-actions" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn-primary">
                {{ editingContent ? 'Salvar Alterações' : 'Publicar Versão 1.0' }}
              </button>
            </div>
          </form>
        </app-ui-modal>

  <app-ui-modal [title]="editingArea ? 'Editar Área' : 'Nova Área de Conhecimento'" [(isOpen)]="isAreaModalOpen" width="500px">
          <form (submit)="saveArea($event)" class="admin-form">
            <div class="form-alert form-alert-error" *ngIf="showAreaError">
              <lucide-icon name="AlertCircle" size="18"></lucide-icon>
              Preencha o nome da área.
            </div>
            <div class="form-group">
              <label>Nome da Área <span class="required-star">*</span></label>
              <input type="text" [(ngModel)]="areaForm.area_conhecimento" name="area_conhecimento" required 
                     [class.invalid-input]="showAreaError && !areaForm.area_conhecimento"
                     placeholder="Ex: Matemática, Programação...">
              <small class="error-hint" *ngIf="showAreaError && !areaForm.area_conhecimento">O nome da área é obrigatório.</small>
            </div>
            
            <div class="form-group">
              <label>Área Pai (Opcional)</label>
              <select [(ngModel)]="areaForm.parent_id" name="parent_id">
                <option [ngValue]="null">Nenhuma (Raiz)</option>
                <option *ngFor="let area of flatAreas" [ngValue]="area.id">{{ area.area_conhecimento }}</option>
              </select>
            </div>

            <div class="form-group checkbox">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" [(ngModel)]="areaForm.permite_conteudo" name="permite_conteudo">
                Permite vincular conteúdo direto
              </label>
            </div>

            <div class="form-actions" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
              <button type="button" class="btn-secondary" (click)="closeAreaModal()">Cancelar</button>
              <button type="submit" class="btn-primary">Salvar Área</button>
            </div>
          </form>
        </app-ui-modal>

        <app-ui-modal [title]="editingQuestion ? 'Editar Questão' : 'Nova Questão'" [(isOpen)]="isQuestionModalOpen" width="800px">
          <form (submit)="saveQuestion($event)" class="admin-form">
            <div class="form-alert form-alert-error" *ngIf="showQuestionError">
              <lucide-icon name="AlertCircle" size="18"></lucide-icon>
              Verifique os campos obrigatórios e garanta que existam pelo menos 2 alternativas com uma correta.
            </div>
            
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Título/Assunto <span class="required-star">*</span></label>
                <input type="text" [(ngModel)]="questionForm.titulo" name="titulo" required 
                       [class.invalid-input]="showQuestionError && !questionForm.titulo"
                       placeholder="Ex: Conceitos de Redes">
                <small class="error-hint" *ngIf="showQuestionError && !questionForm.titulo">O título é obrigatório.</small>
              </div>
              <div class="form-group width-200">
                <label>Código (Opcional)</label>
                <input type="text" [(ngModel)]="questionForm.codigo" name="codigo" placeholder="EX: Q001">
              </div>
            </div>

            <div class="form-group">
              <label>Enunciado <span class="required-star">*</span></label>
              <textarea [(ngModel)]="questionForm.enunciado" name="enunciado" required 
                        [class.invalid-input]="showQuestionError && !questionForm.enunciado"
                        style="min-height: 120px;"
                        placeholder="Digite o enunciado da questão..." rows="4"></textarea>
              <small class="error-hint" *ngIf="showQuestionError && !questionForm.enunciado">O enunciado é obrigatório.</small>
            </div>

            <div class="alternatives-section">
              <div class="section-header">
                <h3>Alternativas</h3>
                <button type="button" class="btn-add" (click)="addAlternative()">
                  <lucide-icon name="Plus" size="16"></lucide-icon>
                  Adicionar
                </button>
              </div>
              
              <div class="alternatives-list">
                <div class="alternative-item" *ngFor="let alt of alternatives; let i = index" [class.is-correct]="alt.is_correta">
                  <div class="radio-wrapper">
                    <input type="radio" [checked]="alt.is_correta" (change)="setCorrect(i)" name="correct_alt" title="Marcar como correta">
                  </div>
                  <input type="text" [(ngModel)]="alt.texto" [name]="'alt_' + i" placeholder="Digite o texto da alternativa..." required>
                  <div class="actions-wrapper">
                    <button type="button" class="btn-remove" (click)="removeAlternative(i)" [disabled]="alternatives.length <= 2" title="Remover alternativa">
                      <lucide-icon name="Trash2" size="18"></lucide-icon>
                    </button>
                  </div>
                </div>
              </div>
              <small class="hint">Marque o rádio para indicar a resposta correta. Mínimo de 2 alternativas.</small>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="closeQuestionModal()">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!isQuestionValid()">Salvar Questão</button>
            </div>
          </form>
        </app-ui-modal>

        <style>
          .btn-danger { background: var(--danger); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
          .btn-danger:hover { opacity: 0.9; }
        </style>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid { display: flex; min-height: calc(100vh - 40px); margin-left: 280px; }
    .sidebar-tree { width: 300px; border-right: 1px solid var(--border); padding: 2rem; background: var(--bg-card); position: sticky; top: 0; align-self: flex-start; }
    .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .sidebar-header h3 { font-size: 1rem; margin: 0; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .btn-icon-primary { display: flex; align-items: center; gap: 4px; border: none; background: var(--primary); color: white; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.2s ease; }
    .btn-icon-primary:hover { filter: brightness(1.1); }
    .content-main { flex: 1; padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; border: none; cursor: pointer; }
    .btn-secondary { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; cursor: pointer; }
    .alert-info { background: rgba(59, 130, 246, 0.1); color: var(--info); padding: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; }
    
    .admin-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .editor-header { display: flex; justify-content: space-between; align-items: center; }
    .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-muted); }
    .form-group input, .form-group select { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-main); color: var(--text-main); }
    .form-group select option { background: var(--bg-main); color: var(--text-main); }
    
    .editor-tabs { display: flex; gap: 0.5rem; }
    .editor-tabs button { padding: 4px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-muted); cursor: pointer; font-size: 0.8rem; }
    .editor-tabs button.active { background: var(--primary); color: white; border-color: var(--primary); }

    .rich-editor { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: var(--bg-card); }
    .toolbar { background: var(--bg-main); padding: 8px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; }
    .tool { padding: 4px 12px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-card); color: var(--text-main); font-weight: bold; cursor: pointer; transition: all 0.2s; }
    .tool:hover { background: var(--primary); color: white; border-color: var(--primary); }
    
    textarea { width: 100%; min-height: 350px; padding: 1rem; border: none; outline: none; font-family: 'Monaco', 'Consolas', monospace; font-size: 0.9rem; background: var(--bg-card); color: var(--text-main); resize: vertical; line-height: 1.5; }
    
    .preview-container { min-height: 350px; padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px; background: white; color: #333; overflow-y: auto; }
    ::ng-deep .preview-container iframe { width: 100%; aspect-ratio: 16/9; border-radius: 8px; border: none; }
    
    .hint { color: var(--text-muted); font-size: 0.8rem; }
    
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; }

    /* Tabs Styling */
    .tabs-container { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 2px; }
    .tab-btn { display: flex; align-items: center; gap: 8px; padding: 0.75rem 1.5rem; background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-weight: 600; font-size: 0.95rem; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.03); }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab-btn lucide-icon { opacity: 0.7; }

    /* Question Form Elements */
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }
    .width-200 { width: 200px; }
    .alternatives-section { background: var(--bg-main); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h3 { font-size: 1rem; margin: 0; font-weight: 600; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }
    .alternatives-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .alternative-item { display: flex; align-items: center; gap: 12px; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); transition: all 0.2s; }
    .alternative-item.is-correct { border-color: var(--success); background: rgba(34, 197, 94, 0.05); }
    .radio-wrapper input { cursor: pointer; accent-color: var(--success); }
    .alternative-item input[type="text"] { flex: 1; border: none; background: transparent; color: var(--text-main); font-size: 0.9rem; outline: none; }
    .actions-wrapper { border-left: 1px solid var(--border); padding-left: 0.5rem; }
    .btn-add { background: var(--success); color: white; border: none; padding: 4px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 600; }
    .btn-remove { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
    .btn-remove:hover:not([disabled]) { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
  `]  
})
export class ContentsComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  private questionService = inject(QuestionService);
  private toastService = inject(ToastService);

  activeTab: 'contents' | 'questions' = 'contents';
  areas: KnowledgeArea[] = [];
  flatAreas: KnowledgeArea[] = [];
  contents: Content[] = [];
  questions: Question[] = [];
  selectedArea: KnowledgeArea | null = null;

  isModalOpen = false;
  isAreaModalOpen = false;
  isQuestionModalOpen = false;
  editingArea: KnowledgeArea | null = null;
  editingContent: Content | null = null;
  contentForm: Partial<Content> = {
    titulo_tema: '',
    descricao: '',
    conteudo_html: '',
    documento_url: '',
    video_url: '',
    versao: 1,
    is_latest: true
  };
  areaForm: Partial<KnowledgeArea> = {
    area_conhecimento: '',
    parent_id: null,
    permite_conteudo: true
  };
  
  questionForm: Partial<Question> = {
    titulo: '',
    enunciado: '',
    codigo: ''
  };
  alternatives: Partial<Alternative>[] = [];

  showError = false;
  showAreaError = false;
  showQuestionError = false;
  isPreviewMode = false;

  // Deletion modals state
  isDeleteContentModalOpen = false;
  contentToDelete: any = null;
  isDeleteQuestionModalOpen = false;
  questionToDelete: any = null;
  isDeleteAreaModalOpen = false;
  areaToDelete: any = null;

  @ViewChild('editorTextarea') editorTextarea!: ElementRef<HTMLTextAreaElement>;

  columns: TableColumn[] = [
    { key: 'titulo_tema', label: 'Título', type: 'text' },
    { key: 'descricao', label: 'Descrição', type: 'text' },
    { key: 'versao', label: 'Versão', type: 'text' },
    { key: 'created_at', label: 'Criado em', type: 'date' }
  ];

  questionColumns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'titulo', label: 'Título', type: 'text' },
    { key: 'enunciado', label: 'Enunciado', type: 'text' },
    { key: 'created_at', label: 'Criado em', type: 'date' }
  ];

  ngOnInit() {
    this.refreshAreas();
  }

  refreshAreas() {
    this.knowledgeService.getAreas().subscribe(data => {
      this.flatAreas = data;
      this.areas = this.buildTree(data);
    });
  }

  refreshContents() {
    if (this.selectedArea) {
      this.knowledgeService.getContentsByArea(this.selectedArea.id).subscribe(data => this.contents = data);
    }
  }

  refreshQuestions() {
    if (this.selectedArea) {
      this.questionService.getQuestionsByArea(this.selectedArea.id).subscribe(data => this.questions = data);
    }
  }

  setTab(tab: 'contents' | 'questions') {
    this.activeTab = tab;
    if (this.selectedArea) {
      if (tab === 'contents') this.refreshContents();
      else this.refreshQuestions();
    }
  }

  onAreaSelect(area: KnowledgeArea) {
    this.selectedArea = area;
    if (area.permite_conteudo) {
      if (this.activeTab === 'contents') this.refreshContents();
      else this.refreshQuestions();
    } else {
      this.contents = [];
      this.questions = [];
    }
  }

  applyTag(tag: string) {
    const textarea = this.editorTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.contentForm.conteudo_html || '';
    const selectedText = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    const openingTag = `<${tag}>`;
    const closingTag = `</${tag}>`;

    this.contentForm.conteudo_html = `${before}${openingTag}${selectedText}${closingTag}${after}`;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openingTag.length, end + openingTag.length);
    }, 0);
  }

  insertLink() {
    const url = prompt('Digite a URL do link:', 'https://');
    if (url) {
      const textarea = this.editorTextarea.nativeElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = this.contentForm.conteudo_html || '';
      const selectedText = text.substring(start, end) || 'descrição do link';

      const before = text.substring(0, start);
      const after = text.substring(end);

      this.contentForm.conteudo_html = `${before}<a href="${url}" target="_blank">${selectedText}</a>${after}`;
    }
  }

  insertVideo() {
    const embedCode = prompt('Cole o código de incorporação (iframe) do YouTube ou URL:', '');
    if (embedCode) {
      let finalEmbed = embedCode;
      if (embedCode.includes('youtube.com/watch?v=')) {
        const videoId = embedCode.split('v=')[1]?.split('&')[0];
        finalEmbed = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
      } else if (embedCode.includes('youtu.be/')) {
        const videoId = embedCode.split('youtu.be/')[1]?.split('?')[0];
        finalEmbed = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
      }

      const textarea = this.editorTextarea.nativeElement;
      const start = textarea.selectionStart;
      const text = this.contentForm.conteudo_html || '';

      const before = text.substring(0, start);
      const after = text.substring(start);

      this.contentForm.conteudo_html = `${before}\n${finalEmbed}\n${after}`;
    }
  }

  openModal(content?: Content) {
    if (!this.selectedArea) return;
    this.showError = false;

    if (content) {
      this.editingContent = content;
      this.contentForm = { ...content };
    } else {
      this.editingContent = null;
      this.contentForm = {
        id_area_conhecimento: this.selectedArea.id,
        titulo_tema: '',
        descricao: '',
        conteudo_html: '',
        documento_url: '',
        video_url: '',
        versao: 1,
        is_latest: true
      };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.showError = false;
  }

  async saveContent(event: Event) {
    event.preventDefault();
    this.showError = false;

    if (!this.contentForm.titulo_tema || !this.contentForm.descricao) {
      this.showError = true;
      return;
    }

    const payload = {
      id_area_conhecimento: this.contentForm.id_area_conhecimento,
      titulo_tema: this.contentForm.titulo_tema,
      descricao: this.contentForm.descricao,
      conteudo_html: this.contentForm.conteudo_html,
      documento_url: this.contentForm.documento_url,
      video_url: this.contentForm.video_url,
      versao: this.contentForm.versao,
      is_latest: this.contentForm.is_latest
    };

    try {
      const response = this.editingContent
        ? await this.knowledgeService.updateContent(this.editingContent.id, payload)
        : await this.knowledgeService.createContent(payload);

      if (response.error) {
        this.toastService.error('Erro ao salvar conteúdo: ' + (response.error as any).message);
        console.error(response.error);
      } else {
        this.toastService.success(this.editingContent ? 'Conteúdo atualizado com sucesso!' : 'Conteúdo criado com sucesso!');
        this.closeModal();
        this.refreshContents();
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      this.toastService.error('Erro inesperado ao salvar conteúdo.');
    }
  }

  confirmDeleteContent(content: Content) {
    this.contentToDelete = content;
    this.isDeleteContentModalOpen = true;
  }

  cancelDeleteContent() {
    this.isDeleteContentModalOpen = false;
    this.contentToDelete = null;
  }

  async executeDeleteContent() {
    if (!this.contentToDelete) return;
    try {
      const { error } = await this.knowledgeService.deleteContent(this.contentToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir: ' + (error as any).message);
      } else {
        this.toastService.success('Conteúdo excluído com sucesso!');
        this.refreshContents();
      }
    } catch (error: any) {
      console.error('Erro ao excluir conteúdo:', error);
      this.toastService.error('Erro ao excluir conteúdo.');
    } finally {
      this.cancelDeleteContent();
    }
  }

  // Question Methods
  openQuestionModal(question?: Question) {
    if (!this.selectedArea) return;
    this.showQuestionError = false;

    if (question) {
      this.editingQuestion = question;
      this.questionForm = { ...question };
      this.alternatives = question.alternatives ? [...question.alternatives.map(a => ({ ...a }))] : [];
    } else {
      this.editingQuestion = null;
      this.questionForm = {
        titulo: '',
        enunciado: '',
        id_area_conhecimento: this.selectedArea.id,
        codigo: ''
      };
      this.alternatives = [
        { texto: '', is_correta: true },
        { texto: '', is_correta: false }
      ];
    }
    this.isQuestionModalOpen = true;
  }

  closeQuestionModal() {
    this.isQuestionModalOpen = false;
    this.showQuestionError = false;
  }

  addAlternative() {
    this.alternatives.push({ texto: '', is_correta: false });
  }

  removeAlternative(index: number) {
    this.alternatives.splice(index, 1);
    if (!this.alternatives.some(a => a.is_correta) && this.alternatives.length > 0) {
      this.alternatives[0].is_correta = true;
    }
  }

  setCorrect(index: number) {
    this.alternatives.forEach((a, i) => a.is_correta = i === index);
  }

  isQuestionValid() {
    return this.questionForm.titulo &&
      this.questionForm.enunciado &&
      this.alternatives.length >= 2 &&
      this.alternatives.every(a => a.texto) &&
      this.alternatives.some(a => a.is_correta);
  }

  editingQuestion: Question | null = null;
  async saveQuestion(event: Event) {
    event.preventDefault();
    this.showQuestionError = false;

    if (!this.isQuestionValid()) {
      this.showQuestionError = true;
      return;
    }

    const payload = {
      titulo: this.questionForm.titulo,
      enunciado: this.questionForm.enunciado,
      id_area_conhecimento: this.selectedArea?.id,
      codigo: this.questionForm.codigo
    };

    try {
      if (this.editingQuestion) {
        await this.questionService.updateQuestion(this.editingQuestion.id, payload, this.alternatives as Alternative[]);
        this.toastService.success('Questão atualizada com sucesso!');
      } else {
        await this.questionService.createQuestion(payload, this.alternatives as Alternative[]);
        this.toastService.success('Questão criada com sucesso!');
      }
      this.closeQuestionModal();
      this.refreshQuestions();
    } catch (error: any) {
      console.error('Erro ao salvar questão:', error);
      this.toastService.error('Erro ao salvar questão.');
    }
  }

  confirmDeleteQuestion(question: Question) {
    this.questionToDelete = question;
    this.isDeleteQuestionModalOpen = true;
  }

  cancelDeleteQuestion() {
    this.isDeleteQuestionModalOpen = false;
    this.questionToDelete = null;
  }

  async executeDeleteQuestion() {
    if (!this.questionToDelete) return;
    try {
      const { error } = await this.questionService.deleteQuestion(this.questionToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir: ' + (error as any).message);
      } else {
        this.toastService.success('Questão excluída com sucesso!');
        this.refreshQuestions();
      }
    } catch (error: any) {
      console.error('Erro ao excluir questão:', error);
      this.toastService.error('Erro ao excluir questão.');
    } finally {
      this.cancelDeleteQuestion();
    }
  }

  openAreaModal(area?: KnowledgeArea) {
    this.showAreaError = false;
    
    if (area) {
      this.editingArea = area;
      this.areaForm = { ...area };
    } else {
      this.editingArea = null;
      this.areaForm = {
        area_conhecimento: '',
        parent_id: this.selectedArea ? this.selectedArea.id : null,
        permite_conteudo: true
      };
    }
    
    this.isAreaModalOpen = true;
  }

  closeAreaModal() {
    this.isAreaModalOpen = false;
    this.showAreaError = false;
    this.editingArea = null;
  }

  onAreaEdit(area: KnowledgeArea) {
    this.openAreaModal(area);
  }

  onAreaDelete(area: KnowledgeArea) {
    this.areaToDelete = area;
    this.isDeleteAreaModalOpen = true;
  }

  cancelDeleteArea() {
    this.isDeleteAreaModalOpen = false;
    this.areaToDelete = null;
  }

  async executeDeleteArea() {
    if (!this.areaToDelete) return;
    try {
      const { error } = await this.knowledgeService.deleteArea(this.areaToDelete.id);
      if (error) {
        this.toastService.error('Erro ao excluir: ' + (error as any).message);
      } else {
        this.toastService.success('Área excluída com sucesso!');
        if (this.selectedArea?.id === this.areaToDelete.id) {
          this.selectedArea = null;
          this.contents = [];
        }
        this.refreshAreas();
      }
    } catch (error: any) {
      console.error('Erro ao excluir área:', error);
      this.toastService.error('Erro ao excluir área.');
    } finally {
      this.cancelDeleteArea();
    }
  }

  async saveArea(event: Event) {
    event.preventDefault();
    this.showAreaError = false;

    if (!this.areaForm.area_conhecimento) {
      this.showAreaError = true;
      return;
    }

    const payload = {
      area_conhecimento: this.areaForm.area_conhecimento,
      parent_id: this.areaForm.parent_id,
      permite_conteudo: this.areaForm.permite_conteudo
    };

    try {
      const response = this.editingArea
        ? await this.knowledgeService.updateArea(this.editingArea.id, payload)
        : await this.knowledgeService.createArea(payload);
        
      if (response.error) {
        this.toastService.error('Erro ao salvar área: ' + (response.error as any).message);
        console.error(response.error);
      } else {
        this.toastService.success(this.editingArea ? 'Área atualizada com sucesso!' : 'Área criada com sucesso!');
        this.closeAreaModal();
        this.refreshAreas();
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      this.toastService.error('Erro inesperado ao salvar área.');
    }
  }

  private buildTree(data: KnowledgeArea[]): KnowledgeArea[] {
    const map = new Map<string, KnowledgeArea>();
    data.forEach(item => map.set(item.id, { ...item, sub_areas: [] }));
    const tree: KnowledgeArea[] = [];
    data.forEach(item => {
      const parentId = item.parent_id || item.id_area_conhecimento_pai;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.sub_areas!.push(map.get(item.id)!);
      } else {
        tree.push(map.get(item.id)!);
      }
    });
    return tree;
  }
}
