import { Component, inject, OnInit, HostListener } from '@angular/core';
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
          <p>Monte o roteiro do curso. Use as setas no mobile ou arraste no desktop.</p>
        </div>
        <button class="btn-primary" (click)="saveCourse()">Salvar Roteiro</button>
      </header>

      <div class="builder-grid">
        <div class="column">
          <h3>Roteiro do Curso</h3>
          <div 
            cdkDropList 
            [cdkDropListData]="courseContents"
            class="drop-list"
            (cdkDropListDropped)="drop($event)">
            
            <div class="empty-state" *ngIf="courseContents.length === 0">
              Adicione conteúdos para começar
            </div>

            <div class="content-item" *ngFor="let item of courseContents; let i = index" cdkDrag [cdkDragDisabled]="isMobile">
              <div class="item-handle" cdkDragHandle *ngIf="!isMobile">
                <lucide-icon name="GripVertical" size="16"></lucide-icon>
              </div>
              
              <!-- Modo Mobile: Botões de Ordenação -->
              <div class="mobile-controls" *ngIf="isMobile">
                <button (click)="move(i, -1)" [disabled]="i === 0"><lucide-icon name="ChevronUp" size="14"></lucide-icon></button>
                <button (click)="move(i, 1)" [disabled]="i === courseContents.length - 1"><lucide-icon name="ChevronDown" size="14"></lucide-icon></button>
              </div>

              <div class="item-info">
                <span class="title">{{item.titulo_tema}}</span>
                <span class="version">v{{item.versao}}</span>
              </div>
              
              <button class="btn-remove" (click)="removeItem(item)">×</button>
            </div>
          </div>
        </div>

        <div class="column">
          <h3>Biblioteca</h3>
          <div class="drop-list library">
            <div class="content-item library" *ngFor="let item of libraryContents">
              <div class="item-info">
                <span class="title">{{item.titulo_tema}}</span>
              </div>
              <button class="btn-add" (click)="addItem(item)">
                <lucide-icon name="Plus" size="16"></lucide-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .builder-container { padding: 2rem; margin-left: 280px; }
    .builder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .drop-list { min-height: 400px; background: var(--bg-card); border: 2px dashed var(--border); border-radius: 12px; padding: 1rem; }
    .content-item { background: white; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
    .item-handle { cursor: grab; color: var(--text-muted); }
    .mobile-controls { display: flex; flex-direction: column; gap: 4px; }
    .mobile-controls button { padding: 2px; background: var(--bg-main); border-radius: 4px; color: var(--text-muted); }
    .item-info { flex: 1; }
    .title { font-weight: 600; font-size: 0.9rem; }
    .version { font-size: 0.7rem; color: var(--primary); background: rgba(37, 99, 235, 0.1); padding: 2px 6px; border-radius: 4px; }
    .btn-add { color: var(--primary); background: none; }
    
    @media (max-width: 1024px) {
      .builder-container { margin-left: 0; padding: 1rem; }
      .builder-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CourseBuilderComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  libraryContents: Content[] = [];
  courseContents: Content[] = [];
  isMobile = false;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 1024;
  }

  ngOnInit() {
    this.onResize();
    this.knowledgeService.getContentsByArea('').subscribe(data => this.libraryContents = data);
  }

  drop(event: CdkDragDrop<Content[]>) {
    moveItemInArray(this.courseContents, event.previousIndex, event.currentIndex);
  }

  move(index: number, direction: number) {
    const newIndex = index + direction;
    const item = this.courseContents.splice(index, 1)[0];
    this.courseContents.splice(newIndex, 0, item);
  }

  addItem(item: Content) {
    if (!this.courseContents.find(c => c.id === item.id)) {
      this.courseContents.push(item);
    }
  }

  removeItem(item: Content) {
    this.courseContents = this.courseContents.filter(c => c.id !== item.id);
  }

  saveCourse() {
    console.log('Salvando...', this.courseContents);
  }
}