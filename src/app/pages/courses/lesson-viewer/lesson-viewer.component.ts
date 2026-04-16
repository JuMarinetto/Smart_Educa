import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, ElementRef, ViewChild, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Content } from '../../../core/models/content.model';
import { ProgressService } from '../../../core/services/progress.service';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiModalComponent],
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

      <!-- YouTube Video Section -->
      <div class="video-section" *ngIf="content.video_url">
        <div class="video-card">
          <div class="video-icon">
            <lucide-icon name="Youtube" size="32"></lucide-icon>
          </div>
          <div class="video-info">
            <h3>Vídeo Complementar</h3>
            <p>Assista a explicação em vídeo sobre este tema.</p>
          </div>
          <button class="btn-video" (click)="openVideoModal()">
            <lucide-icon name="Play" size="18"></lucide-icon>
            Assistir Vídeo
          </button>
        </div>
      </div>

      <div class="lesson-actions">
        <button class="btn-primary" (click)="completeAndNext()" [disabled]="saving">
          <lucide-icon [name]="isCompleted ? 'ChevronRight' : 'CheckCircle'" size="18"></lucide-icon>
          {{ getButtonLabel() }}
        </button>
      </div>

      <!-- Video Modal -->
      <app-ui-modal [title]="content.titulo_tema" [(isOpen)]="isVideoModalOpen" width="900px">
        <div class="video-modal-container" *ngIf="isVideoModalOpen">
          <iframe [src]="getSafeVideoUrl()" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
          </iframe>
        </div>
      </app-ui-modal>
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

    .video-section { margin-top: 2rem; margin-bottom: 2rem; }
    .video-card { display: flex; align-items: center; gap: 20px; padding: 1.5rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: 12px; transition: all 0.2s; }
    .video-card:hover { border-color: #ff0000; background: rgba(255, 0, 0, 0.02); }
    .video-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255, 0, 0, 0.1); color: #ff0000; display: flex; align-items: center; justify-content: center; }
    .video-info { flex: 1; }
    .video-info h3 { font-size: 1rem; margin: 0 0 4px; }
    .video-info p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
    .btn-video { display: flex; align-items: center; gap: 8px; background: #ff0000; color: white; padding: 0.7rem 1.25rem; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .btn-video:hover { background: #cc0000; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 0, 0, 0.2); }

    .video-modal-container { width: 100%; aspect-ratio: 16 / 9; background: #000; border-radius: 8px; overflow: hidden; }
    .video-modal-container iframe { width: 100%; height: 100%; border: none; }


  `]
})
export class LessonViewerComponent implements OnInit, OnChanges {
  @Input() content!: Content;
  @Input() studentId!: string;
  @Input() courseId!: string;
  @Input() isCompleted: boolean = false;
  @Input() isLastItem: boolean = false;
  @Output() progressUpdated = new EventEmitter<string>();
  @Output() nextItem = new EventEmitter<void>();
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private progressService = inject(ProgressService);
  private sanitizer = inject(DomSanitizer);
  private toastService = inject(ToastService);

  safeContent: SafeHtml = '';
  isVideoModalOpen = false;
  saving = false;

  ngOnChanges(changes: SimpleChanges) {
    // Re-initialise content whenever the @Input changes (including first change)
    if (changes['content']) {
      if (this.scrollContainer?.nativeElement) {
        this.scrollContainer.nativeElement.scrollTop = 0;
      }
      this.saving = false;
      this.isVideoModalOpen = false;
      this.initContent();
    }
  }

  ngOnInit() {
    this.initContent();
  }

  private initContent() {
    const raw = this.content?.conteudo_html || '';
    // ✅ SEGURANÇA: Usa sanitização nativa do Angular em vez de bypass total.
    // O DomSanitizer.sanitize() remove tags e atributos perigosos (script, onerror, etc.)
    // enquanto preserva HTML de formatação (p, h1-h6, strong, em, ul, li, etc.)
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, raw) ?? '';
    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  openVideoModal() {
    this.isVideoModalOpen = true;
  }

  getSafeVideoUrl(): SafeResourceUrl {
    const url = this.content?.video_url || '';
    let videoId = '';

    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  async completeAndNext() {
    if (this.saving) return;

    if (!this.isCompleted && this.studentId && this.content && this.courseId) {
      this.saving = true;
      try {
        const result = await this.progressService.updateProgress({
          id_aluno: this.studentId,
          id_conteudo: this.content.id,
          id_curso: this.courseId,
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