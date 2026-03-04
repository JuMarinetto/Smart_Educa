import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { KnowledgeService } from '../../../../core/services/knowledge.service';
import { Content } from '../../../../core/models/content.model';

@Component({
  selector: 'app-course-builder',
  standalone: true,
  imports: [CommonModule, DragDropModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="builder-container">
      <header class="builder-header">
        <div>
          <h1>Construtor de Curso</h1>
          <p>Arraste conteúdos da biblioteca para montar o roteiro do curso.</p>
        </div>
        <button class="btn-primary" (click)="saveCourse()">Salvar Roteiro</button>
      </header>

      <div class="builder-grid">
        <!-- Coluna Esquerda: Roteiro do Curso -->
        <div class="column">
          <h3>Roteiro do Curso</h3>
          <div 
            cdkDropList 
            #courseList="cdkDropList"
            [cdkDropListData]="courseContents"
            [cdkDropListConnectedTo]="[libraryList]"
            class="drop-list"
            (cdkDropListDropped)="drop($event)">
            
            <div class="empty-state" *ngIf="courseContents.length === 0">
              Arraste conteúdos aqui para começar
            </div>

            <div class="content-item" *ngFor="let item of courseContents" cdkDrag>
              <div class="item-handle" cdkDragHandle>
                <lucide-icon name="GripVertical" size="16"></lucide-icon>
              </div>
              <div class="item-info">
                <span class="title">{{item.titulo_tema}}</span>
                <span class="version">v{{item.versao}}</span>
              </div>
              <div class="item-status" *ngIf="hasNewVersion(item)">
                <lucide-icon name="AlertCircle" size="16" class="warning-icon"></lucide-icon>
                <button class="btn-update" (click)="updateVersion(item)">Atualizar</button>
              </div>
              <button class="btn-remove" (click)="removeItem(item)">×</button>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Biblioteca -->
        <div class="column">
          <h3>Biblioteca de Conteúdos</h3>
          <div 
            cdkDropList 
            #libraryList="cdkDropList"
            [cdkDropListData]="libraryContents"
            [cdkDropListConnectedTo]="[courseList]"
            class="drop-list"
            (cdkDropListDropped)="drop($event)">
            
            <div class="content-item library" *ngFor="let item of libraryContents" cdkDrag>
              <div class="item-info">
                <span class="title">{{item.titulo_tema}}</span>
                <span class="desc">{{item.descricao}}</span>
              </div>
              <span class="version">v{{item.versao}}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Alerta de Versão -->
    <div class="modal-overlay" *ngIf="showUpdateModal">
      <div class="modal-content">
        <h3>Nova Versão Disponível</h3>
        <p>O conteúdo <strong>{{pendingUpdate?.titulo_tema}}</strong> possui uma versão mais recente (v2.0). Deseja atualizar a referência no curso?</p>
        <div class="modal-actions">
          <button class="btn-outline" (click)="showUpdateModal = false">Manter Atual</button>
          <button class="btn-primary" (click)="confirmUpdate()">Atualizar para v2.0</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .builder-container { padding: 2rem; margin-left: 280px; }
    .builder-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .builder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .column h3 { font-size: 1rem; margin-bottom: 1rem; color: var(--text-muted); }
    
    .drop-list { 
      min-height: 500px; 
      background: var(--bg-card); 
      border: 2px dashed var(--border); 
      border-radius: 12px; 
      padding: 1rem;
    }
    
    .content-item { 
      background: white; 
      border: 1px solid var(--border); 
      border-radius: 8px; 
      padding: 12px; 
      margin-bottom: 8px; 
      display: flex; 
      align-items: center; 
      gap: 12px;
      box-shadow: var(--shadow-sm);
    }
    
    .item-handle { cursor: grab; color: var(--text-muted); }
    .item-info { flex: 1; display: flex; flex-direction: column; }
    .title { font-weight: 600; font-size: 0.9rem; }
    .desc { font-size: 0.75rem; color: var(--text-muted); }
    .version { font-size: 0.7rem; font-weight: 700; color: var(--primary); background: rgba(37, 99, 235, 0.1); padding: 2px 6px; border-radius: 4px; width: fit-content; }
    
    .warning-icon { color: var(--warning); }
    .btn-update { font-size: 0.7rem; color: var(--primary); font-weight: 700; background: none; border: none; text-decoration: underline; }
    .btn-remove { background: none; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; }
    
    .empty-state { text-align: center; color: var(--text-muted); margin-top: 4rem; font-size: 0.9rem; }
    
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 12px; max-width: 400px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 1.5rem; }
  `]
})
export class CourseBuilderComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);

  libraryContents: Content[] = [];
  courseContents: Content[] = [];
  showUpdateModal = false;
  pendingUpdate: Content | null = null;

  ngOnInit() {
    this.knowledgeService.getContentsByArea('').subscribe(data => {
      this.libraryContents = data;
    });
  }

  drop(event: CdkDragDrop<Content[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  hasNewVersion(item: Content) {
    // Simulação: Em um cenário real, compararia com o banco
    return item.titulo_tema === 'Segurança da Informação' && item.versao === 1;
  }

  updateVersion(item: Content) {
    this.pendingUpdate = item;
    this.showUpdateModal = true;
  }

  confirmUpdate() {
    if (this.pendingUpdate) {
      this.pendingUpdate.versao = 2.0;
      this.showUpdateModal = false;
    }
  }

  removeItem(item: Content) {
    this.courseContents = this.courseContents.filter(i => i.id !== item.id);
    this.libraryContents.push(item);
  }

  saveCourse() {
    console.log('Salvando roteiro...', this.courseContents);
  }
}