import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Content } from '../../../core/models/content.model';
import { ProgressService } from '../../../core/services/progress.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="lesson-container" #scrollContainer>
      <div class="lesson-header">
        <h1>{{content.titulo_tema}}</h1>
        <div class="progress-badge" [class.completed]="isCompleted">
          <lucide-icon [name]="isCompleted ? 'CheckCircle' : 'Circle'" size="16"></lucide-icon>
          {{isCompleted ? 'Concluído' : 'Pendente'}}
        </div>
      </div>

      <div class="lesson-body" [innerHTML]="safeContent"></div>

      <div class="video-placeholder" *ngIf="hasVideo">
        <div class="mock-video-player">
          <lucide-icon name="Play" size="48"></lucide-icon>
          <p>Player de Vídeo</p>
        </div>
      </div>

      <div class="lesson-actions">
        <button class="btn-primary" (click)="completeAndNext()" [disabled]="saving">
          <lucide-icon [name]="isCompleted ? 'ChevronRight' : 'CheckCircle'" size="18"></lucide-icon>
          {{ getButtonLabel() }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .lesson-container { height: 100%; overflow-y: auto; padding: 2rem; background: var(--bg-card); border-radius: var(--radius); }
    .lesson-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    .progress-badge { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: var(--bg-main); color: var(--text-muted); }
    .progress-badge.completed { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .lesson-body { line-height: 1.8; color: var(--text-main); font-size: 1.1rem; margin-bottom: 2rem; }
    .mock-video-player { margin-top: 2rem; height: 300px; background: #000; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; position: relative; margin-bottom: 2rem; }

    .lesson-actions { display: flex; justify-content: flex-end; padding: 2rem 0; border-top: 1px solid var(--border); margin-top: 3rem; }
    .btn-primary { display: flex; align-items: center; gap: 8px; background: var(--primary); color: white; padding: 0.8rem 1.75rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: background 0.2s, transform 0.1s; }
    .btn-primary:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

  `]
})
export class LessonViewerComponent implements OnInit, OnChanges {
  @Input() content!: Content;
  @Input() studentId!: string;
  @Input() isCompleted: boolean = false;
  @Input() isLastItem: boolean = false;
  @Output() progressUpdated = new EventEmitter<string>();
  @Output() nextItem = new EventEmitter<void>();
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private progressService = inject(ProgressService);
  private sanitizer = inject(DomSanitizer);
  private toastService = inject(ToastService);

  safeContent: SafeHtml = '';
  hasVideo = false;
  saving = false;

  ngOnChanges(changes: SimpleChanges) {
    // Re-initialise content whenever the @Input changes (including first change)
    if (changes['content']) {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 0;
      }
      this.saving = false;
      this.initContent();
    }
  }

  ngOnInit() {
    this.initContent();
  }

  private initContent() {
    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.content?.conteudo_html || '');
    this.hasVideo = this.content?.conteudo_html?.includes('iframe') || false;
  }

  async completeAndNext() {
    if (this.saving) return;

    if (!this.isCompleted && this.studentId && this.content) {
      this.saving = true;
      try {
        const result = await this.progressService.updateProgress({
          id_aluno: this.studentId,
          id_conteudo: this.content.id,
          status: 'CONCLUIDO',
          porcentagem_concluida: 100
        });

        if (result && result.error) {
          this.toastService.error('Erro ao salvar progresso: ' + result.error.message);
          this.saving = false;
          return; // Don't advance on error
        }

        this.isCompleted = true;
        this.progressUpdated.emit(this.content.id);
      } catch (e: any) {
        this.toastService.error('Falha na comunicação de progresso.');
        this.saving = false;
        return; // Don't advance on error
      }
    }

    this.saving = false;
    // Always navigate to next item (or trigger completion)
    this.nextItem.emit();
  }

  getButtonLabel(): string {
    if (this.isLastItem) {
      return this.isCompleted ? 'Concluir' : 'Concluir';
    }
    return this.isCompleted ? 'Próximo' : 'Concluir e Ir para o Próximo';
  }
}