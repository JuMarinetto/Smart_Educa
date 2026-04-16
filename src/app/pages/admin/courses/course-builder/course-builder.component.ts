import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { KnowledgeService } from '../../../../core/services/knowledge.service';
import { CourseService } from '../../../../core/services/course.service';
import { QuestionService } from '../../../../core/services/question.service';
import { Content } from '../../../../core/models/content.model';
import { Question } from '../../../../core/models/question.model';
import { Course, CourseAttachment } from '../../../../core/models/course.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { KnowledgeArea } from '../../../../core/models/knowledge-area.model';

export interface CourseItem {
  tipo: 'conteudo' | 'questao';
  content?: Content;
  question?: Question;
}

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [CommonModule, DragDropModule, LucideAngularModule, UiCardComponent, FormsModule, UiModalComponent],
  template: `
    <div class="builder-container">
      <header class="builder-header">
        <div>
          <h1>Construtor de Curso <span *ngIf="courseTitle">- {{ courseTitle }}</span></h1>
          <p>Organize o curso em módulos e arraste conteúdos e questões da biblioteca.</p>
        </div>
        <div class="header-right">
          <button class="btn-attachments" (click)="isAttachmentsModalOpen = true">
            <lucide-icon name="Paperclip" size="18"></lucide-icon>
            Anexos do Curso
          </button>
          <button class="btn-add-module" (click)="addModule()">
            <lucide-icon name="Plus" size="18"></lucide-icon>
            Adicionar Módulo / Seção
          </button>
        </div>
      </header>

      <div class="builder-grid" cdkDropListGroup>
        <div class="column roadmap-column">
          <div class="column-header">
            <h3>Roteiro do Curso</h3>
            <span class="badge">{{ getTotalItems() }} itens</span>
          </div>
          
          <div class="modules-container">
            <div class="empty-state" *ngIf="courseModules.length === 0">
              Crie um módulo ou arraste os conteúdos da biblioteca.
            </div>

            <div class="module-card" *ngFor="let mod of courseModules; let i = index">
              <div class="module-header">
                <lucide-icon name="GripVertical" size="18" class="text-muted"></lucide-icon>
                <input type="text" [(ngModel)]="mod.nome" (change)="saveCourse()" placeholder="Nome do Módulo">
                <button class="btn-remove-mod" (click)="removeModule(i)">
                  <lucide-icon name="Trash2" size="18"></lucide-icon>
                </button>
              </div>
              
              <div class="module-drop-list" 
                   cdkDropList 
                   [cdkDropListData]="mod.items"
                   (cdkDropListDropped)="onDrop($event)">
                <div class="content-item" 
                     *ngFor="let item of mod.items; let j = index" 
                     cdkDrag
                     [class.question-item]="item.tipo === 'questao'">
                  <div class="item-handle" cdkDragHandle *ngIf="!isMobile">
                    <lucide-icon name="GripVertical" size="16"></lucide-icon>
                  </div>
                  <div class="item-type-badge" [class.type-question]="item.tipo === 'questao'">
                    <lucide-icon [name]="item.tipo === 'questao' ? 'HelpCircle' : 'FileText'" size="14"></lucide-icon>
                  </div>
                  <div class="item-info">
                    <span class="title">{{ getItemTitle(item) }}</span>
                    <span class="type-label" *ngIf="item.tipo === 'questao'">Questão</span>
                    <span class="version" *ngIf="item.tipo === 'conteudo' && item.content?.versao">v{{item.content?.versao}}</span>
                  </div>
                  <button class="btn-remove" (click)="removeItem(i, j)">
                    <lucide-icon name="X" size="16"></lucide-icon>
                  </button>
                  <div class="drag-placeholder" *cdkDragPlaceholder></div>
                </div>
                
                <div class="module-empty-state" *ngIf="mod.items.length === 0">
                  Arraste conteúdos ou questões para este módulo
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="column library-column">
          <div class="column-header">
            <h3>Biblioteca</h3>
          </div>

          <!-- Tabs -->
          <div class="library-tabs">
            <button class="lib-tab" 
                    [class.active]="activeLibraryTab === 'conteudos'"
                    (click)="activeLibraryTab = 'conteudos'">
              <lucide-icon name="FileText" size="14"></lucide-icon>
              Conteúdos
            </button>
            <button class="lib-tab" 
                    [class.active]="activeLibraryTab === 'questoes'"
                    (click)="activeLibraryTab = 'questoes'">
              <lucide-icon name="HelpCircle" size="14"></lucide-icon>
              Questões
            </button>
          </div>

          <div class="library-search">
            <lucide-icon name="Search" size="16"></lucide-icon>
            <input type="text" placeholder="Buscar na biblioteca..." (input)="onSearch($event)">
          </div>

          <!-- Conteúdos Tab -->
          <div class="library-content-scroll" *ngIf="activeLibraryTab === 'conteudos'">
            <div class="area-group" *ngFor="let group of groupedLibrary">
              <div class="area-header-card" [class.is-expanded]="expandedAreas.has(group.areaId)">
                <div class="item-handle-visual" *ngIf="!isMobile">
                  <lucide-icon name="GripVertical" size="16"></lucide-icon>
                </div>
                
                <div class="area-clickable-zone" (click)="toggleArea(group.areaId)">
                  <lucide-icon [name]="expandedAreas.has(group.areaId) ? 'ChevronDown' : 'ChevronRight'" size="16" class="toggle-icon"></lucide-icon>
                  <span class="area-name">{{ group.areaName }}</span>
                  <span class="area-count-badge">{{ group.contents.length }}</span>
                </div>

                <button class="btn-add-area" (click)="addAreaContents(group)" [disabled]="courseModules.length === 0 || group.contents.length === 0" title="Adicionar todos os conteúdos desta área">
                  <lucide-icon name="Plus" size="16"></lucide-icon>
                </button>
              </div>

              <div class="area-contents-nested" [class.expanded]="expandedAreas.has(group.areaId)">
                <div class="drop-list library" 
                     cdkDropList 
                     [cdkDropListData]="group.contents"
                     (cdkDropListDropped)="onDropContent($event)">
                  <div class="content-item library nested" *ngFor="let item of group.contents" cdkDrag>
                    <div class="item-handle" cdkDragHandle *ngIf="!isMobile">
                      <lucide-icon name="GripVertical" size="16"></lucide-icon>
                    </div>
                    <div class="item-info">
                      <span class="title">{{item.titulo_tema}}</span>
                    </div>
                    <button class="btn-add" (click)="addContentToFirstModule(item)" [disabled]="courseModules.length === 0">
                      <lucide-icon name="Plus" size="16"></lucide-icon>
                    </button>
                    <div class="drag-placeholder" *cdkDragPlaceholder></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="empty-library-state" *ngIf="groupedLibrary.length === 0">
              Nenhum conteúdo encontrado.
            </div>
          </div>

          <!-- Questões Tab -->
          <div class="library-content-scroll" *ngIf="activeLibraryTab === 'questoes'">
            <div class="area-group" *ngFor="let qGroup of groupedQuestions">
              <div class="area-header-card" [class.is-expanded]="expandedQuestionAreas.has(qGroup.areaId)">
                <div class="item-handle-visual" *ngIf="!isMobile">
                  <lucide-icon name="HelpCircle" size="16"></lucide-icon>
                </div>
                
                <div class="area-clickable-zone" (click)="toggleQuestionArea(qGroup.areaId)">
                  <lucide-icon [name]="expandedQuestionAreas.has(qGroup.areaId) ? 'ChevronDown' : 'ChevronRight'" size="16" class="toggle-icon"></lucide-icon>
                  <span class="area-name">{{ qGroup.areaName }}</span>
                  <span class="area-count-badge">{{ qGroup.questions.length }}</span>
                </div>

                <button class="btn-add-area" (click)="addAreaQuestions(qGroup)" [disabled]="courseModules.length === 0 || qGroup.questions.length === 0" title="Adicionar todas as questões desta área">
                  <lucide-icon name="Plus" size="16"></lucide-icon>
                </button>
              </div>

              <div class="area-contents-nested" [class.expanded]="expandedQuestionAreas.has(qGroup.areaId)">
                <div class="drop-list library" 
                     cdkDropList 
                     [cdkDropListData]="qGroup.questions"
                     (cdkDropListDropped)="onDropQuestion($event)">
                  <div class="content-item library nested question-lib-item" *ngFor="let q of qGroup.questions" cdkDrag>
                    <div class="item-handle" cdkDragHandle *ngIf="!isMobile">
                      <lucide-icon name="GripVertical" size="16"></lucide-icon>
                    </div>
                    <div class="item-type-badge type-question">
                      <lucide-icon name="HelpCircle" size="12"></lucide-icon>
                    </div>
                    <div class="item-info">
                      <span class="title">{{ q.titulo || truncate(q.enunciado, 50) }}</span>
                    </div>
                    <button class="btn-add" (click)="addQuestionToFirstModule(q)" [disabled]="courseModules.length === 0">
                      <lucide-icon name="Plus" size="16"></lucide-icon>
                    </button>
                    <div class="drag-placeholder" *cdkDragPlaceholder></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="empty-library-state" *ngIf="groupedQuestions.length === 0">
              Nenhuma questão encontrada.
            </div>
          </div>
        </div>
      </div>

      <div class="footer-actions">
        <button class="btn-secondary" (click)="goBack()">Voltar</button>
        <button class="btn-primary" (click)="saveCourse()" [disabled]="isSaving || courseModules.length === 0">
          <lucide-icon name="Save" size="18"></lucide-icon>
          {{ isSaving ? 'Salvando...' : 'Salvar Roteiro' }}
        </button>
      </div>
    </div>

    <!-- Modals -->
    <app-ui-modal title="Anexos do Curso" [(isOpen)]="isAttachmentsModalOpen" width="550px">
      <div class="attachments-modal-content">
        <p class="description">Gerencie os materiais de apoio que os alunos poderão baixar.</p>
        
        <div class="attachments-list" *ngIf="anexos.length > 0">
          <div class="attachment-item" *ngFor="let file of anexos">
            <lucide-icon name="File" size="18" class="file-icon"></lucide-icon>
            <div class="file-info">
              <span class="file-name" title="{{file.name}}">{{ file.name }}</span>
              <span class="file-meta" *ngIf="file.size">{{ (file.size / 1024 / 1024) | number:'1.1-1' }} MB</span>
            </div>
            <div class="file-actions">
              <a [href]="file.url" target="_blank" class="btn-icon" title="Baixar">
                <lucide-icon name="Download" size="16"></lucide-icon>
              </a>
              <button type="button" class="btn-icon delete" (click)="removeAttachment(file)" title="Excluir">
                <lucide-icon name="Trash2" size="16"></lucide-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="empty-attachments" *ngIf="anexos.length === 0">
          <lucide-icon name="Info" size="32"></lucide-icon>
          <p>Nenhum anexo adicionado a este curso.</p>
        </div>

        <div class="upload-section">
          <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none">
          <button type="button" class="btn-upload" (click)="fileInput.click()" [disabled]="isUploading">
            <lucide-icon [name]="isUploading ? 'Loader2' : 'Upload'" size="18" [class.spin]="isUploading"></lucide-icon>
            {{ isUploading ? 'Enviando Arquivo...' : 'Clique para Anexar Arquivo' }}
          </button>
          <p class="upload-hint">Formatos suportados: PDF, DOCX, ZIP, MP4, Imagens (Máx 10MB)</p>
        </div>
      </div>
    </app-ui-modal>
  `,
  styles: [`
    .builder-container { padding: 2rem; margin-left: 280px; }
    .builder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header-right { display: flex; gap: 1rem; align-items: center; }
    .builder-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem; align-items: flex-start; }
    
    .column-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .badge { background: var(--primary-light); color: var(--primary); padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    
    .btn-add-module { background: var(--bg-card); border: 1px solid var(--primary); color: var(--primary); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: all 0.2s; }
    .btn-add-module:hover { background: var(--primary); color: white; }

    .btn-attachments { background: rgba(37, 99, 235, 0.05); border: 1px dashed var(--primary); color: var(--primary); padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: all 0.2s; }
    .btn-attachments:hover { background: rgba(37, 99, 235, 0.1); border-style: solid; }

    .modules-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .module-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
    .module-header { display: flex; gap: 1rem; margin-bottom: 1rem; align-items: center; }
    .module-header input { flex: 1; background: transparent; border: none; border-bottom: 2px solid var(--border); padding: 0.5rem 0; font-weight: 700; font-size: 1.1rem; color: var(--text-main); outline: none; transition: border-color 0.2s; }
    .module-header input:focus { border-color: var(--primary); }
    .btn-remove-mod { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: 4px; }
    .btn-remove-mod:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

    .module-drop-list { min-height: 80px; border: 1px dashed var(--border); border-radius: 8px; padding: 0.5rem; background: rgba(0,0,0,0.02); transition: background-color 0.2s; }
    .module-drop-list.cdk-drop-list-dragging { background: rgba(37, 99, 235, 0.05); border-color: var(--primary); }
    .module-empty-state { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem; }

    .content-item { background: var(--bg-main); border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; color: var(--text-main); cursor: grab; transition: transform 0.2s, box-shadow 0.2s; }
    .content-item:active { cursor: grabbing; }
    .content-item.question-item { border-left: 3px solid #f59e0b; }
    .cdk-drag-preview { box-shadow: 0 10px 20px rgba(0,0,0,0.1); border-radius: 8px; opacity: 0.9; }
    .cdk-drag-placeholder { opacity: 0.3; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }

    .item-type-badge { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: rgba(37, 99, 235, 0.1); color: var(--primary); flex-shrink: 0; }
    .item-type-badge.type-question { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

    .type-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #f59e0b; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 1px 6px; border-radius: 4px; }

    /* Library tabs */
    .library-tabs { display: flex; gap: 4px; margin-bottom: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 4px; }
    .lib-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem 0.75rem; border: none; background: transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .lib-tab:hover { color: var(--text-main); background: rgba(255,255,255,0.05); }
    .lib-tab.active { background: var(--primary); color: white; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3); }

    .library-column .drop-list { max-height: none; overflow: visible; background: transparent; border: none; border-radius: 0; padding: 0.25rem 0.5rem; transition: background-color 0.2s; }
    .library-column .drop-list.cdk-drop-list-dragging { background: rgba(0,0,0,0.05); }

    .library-content-scroll { max-height: 600px; overflow-y: auto; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-card); padding: 0.5rem; }
    
    .area-group { margin-bottom: 0.5rem; }
    .area-header-card { 
      background: var(--bg-main); 
      border: 1px solid var(--border); 
      border-radius: 8px; 
      padding: 12px; 
      margin-bottom: 4px; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      color: var(--text-main);
      transition: all 0.2s;
    }
    .area-header-card.is-expanded { border-color: var(--primary); background: rgba(37, 99, 235, 0.02); }
    
    .area-clickable-zone { flex: 1; display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .area-name { font-weight: 600; font-size: 0.9rem; }
    .area-count-badge { font-size: 0.75rem; color: var(--text-muted); background: var(--border); padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
    .toggle-icon { color: var(--text-muted); }
    
    .item-handle-visual { color: var(--text-muted); opacity: 0.5; }
    
    .btn-add-area { color: var(--primary); background: rgba(37, 99, 235, 0.1); border: none; cursor: pointer; border-radius: 4px; padding: 4px; display: flex; align-items: center; justify-content: center; }
    .btn-add-area:hover:not(:disabled) { background: var(--primary); color: white; }
    .btn-add-area:disabled { opacity: 0.3; cursor: not-allowed; }

    .area-contents-nested { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
    .area-contents-nested.expanded { max-height: 2000px; transition: max-height 0.5s ease-in; }
    .content-item.nested { margin-left: 1.5rem; transform: scale(0.98); }
    .question-lib-item { border-left: 3px solid #f59e0b; }

    .library-search { display: flex; align-items: center; gap: 8px; padding: 0.6rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card); margin-bottom: 1rem; color: var(--text-muted); }
    .library-search input { border: none; background: none; color: var(--text-main); flex: 1; outline: none; font-size: 0.9rem; }

    .empty-library-state { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem; }

    .btn-add { color: var(--primary); background: none; border: none; cursor: pointer; font-size: 1.2rem; }
    .btn-add:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-remove { color: #ef4444; background: none; border: none; cursor: pointer; font-size: 1.2rem; }
    
    .btn-secondary { background: var(--bg-main); border: 1px solid var(--border); color: var(--text-main); padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary { display: flex; align-items: center; gap: 8px; background: var(--primary); color: white; padding: 0.8rem 1.75rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .footer-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }

    .empty-state { text-align: center; padding: 3rem; background: var(--bg-card); border: 2px dashed var(--border); border-radius: 12px; color: var(--text-muted); }

    @media (max-width: 1024px) {
      .builder-container { margin-left: 0; padding: 1rem; }
      .builder-grid { grid-template-columns: 1fr; }
      .header-right { flex-direction: column; width: 100%; gap: 0.5rem; }
      .btn-add-module, .btn-attachments { width: 100%; justify-content: center; }
    }

    /* Modal Styles */
    .attachments-modal-content { display: flex; flex-direction: column; gap: 1.5rem; }
    .description { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem; }
    
    .attachments-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 300px; overflow-y: auto; padding-right: 0.5rem; }
    .attachment-item { display: flex; align-items: center; gap: 12px; padding: 0.75rem 1rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: 10px; }
    .file-icon { color: var(--primary); opacity: 0.7; }
    .file-info { flex: 1; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
    .file-name { font-size: 0.85rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-meta { font-size: 0.7rem; color: var(--text-muted); }
    
    .file-actions { display: flex; gap: 4px; }
    .btn-icon { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-icon:hover { background: rgba(0,0,0,0.05); color: var(--primary); }
    .btn-icon.delete:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }

    .empty-attachments { text-align: center; padding: 2rem; background: var(--bg-main); border-radius: 12px; border: 1px dashed var(--border); color: var(--text-muted); opacity: 0.7; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .empty-attachments p { font-size: 0.85rem; }

    .upload-section { margin-top: 1rem; padding: 1.5rem; border: 2px dashed var(--border); border-radius: 12px; text-align: center; background: rgba(37, 99, 235, 0.02); }
    .btn-upload { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; margin: 0 auto 1rem; transition: all 0.2s; }
    .btn-upload:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
    .btn-upload:disabled { opacity: 0.6; cursor: not-allowed; }
    .upload-hint { font-size: 0.75rem; color: var(--text-muted); }
    
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class CourseBuilderComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  private courseService = inject(CourseService);
  private questionService = inject(QuestionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  allContents: Content[] = [];
  allQuestions: Question[] = [];
  libraryContents: Content[] = [];
  libraryQuestions: Question[] = [];
  courseModules: { id?: string, nome: string, items: CourseItem[] }[] = [];
  filteredLibrary: Content[] = [];

  areas: KnowledgeArea[] = [];
  groupedLibrary: { areaId: string, areaName: string, contents: Content[] }[] = [];
  groupedQuestions: { areaId: string, areaName: string, questions: Question[] }[] = [];
  expandedAreas: Set<string> = new Set();
  expandedQuestionAreas: Set<string> = new Set();

  activeLibraryTab: 'conteudos' | 'questoes' = 'conteudos';
  searchTerm = '';

  courseId: string | null = null;
  courseTitle: string = '';
  anexos: CourseAttachment[] = [];
  isMobile = false;
  isSaving = false;
  isUploading = false;
  isAttachmentsModalOpen = false;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 1024;
  }

  ngOnInit() {
    this.onResize();

    // Fetch areas first
    this.knowledgeService.getAreas().subscribe(areas => {
      this.areas = areas;

      // Then fetch contents
      this.knowledgeService.getContentsByArea('').subscribe(data => {
        this.allContents = data;
        this.filteredLibrary = [...data];
        this.updateLibrary();

        // Expand areas that have content initially
        this.groupedLibrary.forEach(g => {
          if (g.contents.length > 0) this.expandedAreas.add(g.areaId);
        });
      });

      // Fetch questions
      this.questionService.getQuestions().subscribe(questions => {
        this.allQuestions = questions;
        this.updateQuestionLibrary();

        this.groupedQuestions.forEach(g => {
          if (g.questions.length > 0) this.expandedQuestionAreas.add(g.areaId);
        });
      });
    });

    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.courseId = params['id'];
        this.loadCourse(this.courseId!);
      }
    });
  }

  loadCourse(id: string) {
    this.courseService.getCourseStructure(id).subscribe(topics => {
      if (topics.length > 0 && topics[0].courses) {
        this.courseTitle = topics[0].courses.titulo;
        this.anexos = topics[0].courses.anexos || [];
      }

      // Build modules with unified items
      this.courseModules = topics.map((t: any) => ({
        id: t.id,
        nome: t.nome_topico,
        items: (t.course_contents || [])
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((cc: any) => {
            if (cc.tipo === 'questao' && cc.questions) {
              return { tipo: 'questao' as const, question: cc.questions };
            } else if (cc.contents) {
              return { tipo: 'conteudo' as const, content: cc.contents };
            }
            return null;
          })
          .filter((item: any) => !!item)
      }));

      if (this.courseModules.length === 0) {
        this.addModule();
      }

      this.updateLibrary();
      this.updateQuestionLibrary();
    });
  }

  // ---- Content Library ----

  updateLibrary() {
    const courseContentIds = new Set<string>();
    this.courseModules.forEach(mod => {
      mod.items.forEach(item => {
        if (item.tipo === 'conteudo' && item.content) {
          courseContentIds.add(item.content.id);
        }
      });
    });

    this.libraryContents = this.allContents.filter(c => !courseContentIds.has(c.id));
    this.applyContentFilters(this.searchTerm);
  }

  applyContentFilters(searchTerm: string = '') {
    const term = searchTerm.toLowerCase();

    const filtered = this.libraryContents.filter(c =>
      c.titulo_tema.toLowerCase().includes(term) ||
      c.descricao?.toLowerCase().includes(term)
    );

    const groupsMap = new Map<string, { areaId: string, areaName: string, contents: Content[] }>();

    this.areas.forEach(a => {
      if (a.permite_conteudo) {
        groupsMap.set(a.id, { areaId: a.id, areaName: a.area_conhecimento, contents: [] });
      }
    });

    filtered.forEach(c => {
      const group = groupsMap.get(c.id_area_conhecimento);
      if (group) {
        group.contents.push(c);
      } else {
        const unknownId = 'unknown';
        if (!groupsMap.has(unknownId)) {
          groupsMap.set(unknownId, { areaId: unknownId, areaName: 'Sem Área', contents: [] });
        }
        groupsMap.get(unknownId)!.contents.push(c);
      }
    });

    this.groupedLibrary = Array.from(groupsMap.values())
      .filter(g => g.contents.length > 0 || !term);
  }

  // ---- Question Library ----

  updateQuestionLibrary() {
    const courseQuestionIds = new Set<string>();
    this.courseModules.forEach(mod => {
      mod.items.forEach(item => {
        if (item.tipo === 'questao' && item.question) {
          courseQuestionIds.add(item.question.id);
        }
      });
    });

    this.libraryQuestions = this.allQuestions.filter(q => !courseQuestionIds.has(q.id));
    this.applyQuestionFilters(this.searchTerm);
  }

  applyQuestionFilters(searchTerm: string = '') {
    const term = searchTerm.toLowerCase();

    const filtered = this.libraryQuestions.filter(q =>
      (q.titulo || '').toLowerCase().includes(term) ||
      q.enunciado.toLowerCase().includes(term)
    );

    const groupsMap = new Map<string, { areaId: string, areaName: string, questions: Question[] }>();

    this.areas.forEach(a => {
      groupsMap.set(a.id, { areaId: a.id, areaName: a.area_conhecimento, questions: [] });
    });

    filtered.forEach(q => {
      const group = groupsMap.get(q.id_area_conhecimento || '');
      if (group) {
        group.questions.push(q);
      } else {
        const unknownId = 'unknown-q';
        if (!groupsMap.has(unknownId)) {
          groupsMap.set(unknownId, { areaId: unknownId, areaName: 'Sem Área', questions: [] });
        }
        groupsMap.get(unknownId)!.questions.push(q);
      }
    });

    this.groupedQuestions = Array.from(groupsMap.values())
      .filter(g => g.questions.length > 0 || !term);
  }

  // ---- Toggle areas ----

  toggleArea(areaId: string) {
    if (this.expandedAreas.has(areaId)) {
      this.expandedAreas.delete(areaId);
    } else {
      this.expandedAreas.add(areaId);
    }
  }

  toggleQuestionArea(areaId: string) {
    if (this.expandedQuestionAreas.has(areaId)) {
      this.expandedQuestionAreas.delete(areaId);
    } else {
      this.expandedQuestionAreas.add(areaId);
    }
  }

  // ---- Helpers ----

  getTotalItems() {
    return this.courseModules.reduce((acc, mod) => acc + mod.items.length, 0);
  }

  getItemTitle(item: CourseItem): string {
    if (item.tipo === 'questao' && item.question) {
      return item.question.titulo || this.truncate(item.question.enunciado, 60);
    }
    if (item.tipo === 'conteudo' && item.content) {
      return item.content.titulo_tema;
    }
    // Fallback: handle raw objects that might not be wrapped properly
    const raw = item as any;
    if (raw.titulo_tema) return raw.titulo_tema;
    if (raw.enunciado) return this.truncate(raw.enunciado, 60);
    if (raw.titulo) return raw.titulo;
    return '(sem título)';
  }

  truncate(text: string, max: number): string {
    if (!text) return '';
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

  // ---- Module actions ----

  addModule() {
    this.courseModules.push({
      nome: 'Módulo ' + (this.courseModules.length + 1),
      items: []
    });
  }

  removeModule(index: number) {
    if (confirm('Deseja remover este módulo? Os itens voltarão para a biblioteca.')) {
      this.courseModules.splice(index, 1);
      this.updateLibrary();
      this.updateQuestionLibrary();
    }
  }

  // ---- Current search ----

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.applyContentFilters(this.searchTerm);
    this.applyQuestionFilters(this.searchTerm);
  }

  // ---- Add actions ----

  addContentToFirstModule(item: Content) {
    if (this.courseModules.length > 0) {
      const exists = this.courseModules.some(mod =>
        mod.items.some(i => i.tipo === 'conteudo' && i.content?.id === item.id)
      );
      if (!exists) {
        this.courseModules[0].items.push({ tipo: 'conteudo', content: item });
        this.updateLibrary();
      }
    }
  }

  addQuestionToFirstModule(q: Question) {
    if (this.courseModules.length > 0) {
      const exists = this.courseModules.some(mod =>
        mod.items.some(i => i.tipo === 'questao' && i.question?.id === q.id)
      );
      if (!exists) {
        this.courseModules[0].items.push({ tipo: 'questao', question: q });
        this.updateQuestionLibrary();
      }
    }
  }

  addAreaContents(group: any) {
    if (this.courseModules.length > 0) {
      let added = 0;
      group.contents.forEach((item: Content) => {
        const exists = this.courseModules.some(mod =>
          mod.items.some(i => i.tipo === 'conteudo' && i.content?.id === item.id)
        );
        if (!exists) {
          this.courseModules[0].items.push({ tipo: 'conteudo', content: item });
          added++;
        }
      });
      if (added > 0) {
        this.updateLibrary();
        this.toastService.success(`${added} conteúdos adicionados ao primeiro módulo.`);
      }
    }
  }

  addAreaQuestions(group: any) {
    if (this.courseModules.length > 0) {
      let added = 0;
      group.questions.forEach((q: Question) => {
        const exists = this.courseModules.some(mod =>
          mod.items.some(i => i.tipo === 'questao' && i.question?.id === q.id)
        );
        if (!exists) {
          this.courseModules[0].items.push({ tipo: 'questao', question: q });
          added++;
        }
      });
      if (added > 0) {
        this.updateQuestionLibrary();
        this.toastService.success(`${added} questões adicionadas ao primeiro módulo.`);
      }
    }
  }

  // ---- Remove item ----

  removeItem(modIdx: number, itemIdx: number) {
    this.courseModules[modIdx].items.splice(itemIdx, 1);
    this.updateLibrary();
    this.updateQuestionLibrary();
  }

  // ---- Drag & Drop ----

  /**
   * Detects if a raw item is a Content, Question, or already a CourseItem
   * and wraps it as CourseItem if needed.
   */
  private wrapAsCourseItem(raw: any): CourseItem {
    // Already a CourseItem
    if (raw.tipo === 'conteudo' || raw.tipo === 'questao') {
      return raw as CourseItem;
    }
    // Raw Content (has titulo_tema)
    if (raw.titulo_tema !== undefined) {
      return { tipo: 'conteudo', content: raw };
    }
    // Raw Question (has enunciado)
    if (raw.enunciado !== undefined) {
      return { tipo: 'questao', question: raw };
    }
    // Fallback
    return { tipo: 'conteudo', content: raw };
  }

  /**
   * Detects if a CourseItem should be unwrapped back to raw Content or Question
   * when returning to a library list.
   */
  private unwrapFromCourseItem(item: any): any {
    if (item.tipo === 'conteudo' && item.content) return item.content;
    if (item.tipo === 'questao' && item.question) return item.question;
    return item;
  }

  /**
   * Checks if a drop list belongs to a module (CourseItem[]) or library.
   * Module drop lists are identified by being part of courseModules.
   */
  private isModuleList(data: any[]): boolean {
    // Module lists belong to courseModules
    return this.courseModules.some(mod => mod.items === data);
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const prevData = event.previousContainer.data;
    const currData = event.container.data;
    const rawItem = prevData[event.previousIndex];

    // Remove from source
    prevData.splice(event.previousIndex, 1);

    // Determine target type and insert appropriately
    if (this.isModuleList(currData)) {
      // Dropping INTO a module -> wrap as CourseItem
      const wrappedItem = this.wrapAsCourseItem(rawItem);
      currData.splice(event.currentIndex, 0, wrappedItem);
    } else {
      // Dropping INTO a library -> unwrap from CourseItem
      const unwrapped = this.unwrapFromCourseItem(rawItem);
      currData.splice(event.currentIndex, 0, unwrapped);
    }

    this.updateLibrary();
    this.updateQuestionLibrary();
  }

  onDropContent(event: CdkDragDrop<any[]>) {
    this.onDrop(event);
  }

  onDropQuestion(event: CdkDragDrop<any[]>) {
    this.onDrop(event);
  }

  // ---- Save ----

  async saveCourse() {
    if (!this.courseId) return;

    this.isSaving = true;
    try {
      const { error } = await this.courseService.saveCourseStructure(this.courseId, this.courseModules);
      if (error) {
        this.toastService.error('Erro ao salvar o roteiro: ' + error.message);
      } else {
        this.toastService.success('Roteiro do curso salvo com sucesso!');
        this.goBack();
      }
    } catch (err: any) {
      this.toastService.error('Erro inesperado ao salvar.');
      console.error(err);
    } finally {
      this.isSaving = false;
    }
  }

  goBack() {
    this.router.navigate(['/admin/courses']);
  }

  // ---- Attachment Actions ----

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.courseId) return;

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('Arquivo muito grande. O limite é 10MB.');
      return;
    }

    this.isUploading = true;
    try {
      const result: any = await this.courseService.uploadAttachment(
        this.courseId,
        file,
        this.anexos
      );

      if (result.error) {
        this.toastService.error('Erro ao enviar arquivo: ' + result.error.message);
      } else {
        this.toastService.success('Arquivo enviado com sucesso!');
        this.anexos = result.data.anexos;
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      this.toastService.error('Erro inesperado no upload.');
    } finally {
      this.isUploading = false;
      event.target.value = ''; // Reset input
    }
  }

  async removeAttachment(attachment: CourseAttachment) {
    if (!this.courseId || !confirm(`Deseja remover o anexo "${attachment.name}"?`)) return;

    try {
      const result: any = await this.courseService.deleteAttachment(
        this.courseId,
        attachment,
        this.anexos
      );

      if (result.error) {
        this.toastService.error('Erro ao remover arquivo: ' + result.error.message);
      } else {
        this.toastService.success('Anexo removido!');
        this.anexos = result.data.anexos;
      }
    } catch (err) {
      console.error('Erro ao remover:', err);
      this.toastService.error('Erro ao remover anexo.');
    }
  }
}