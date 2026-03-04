import { Component, Input, OnInit, OnDestroy, inject, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Content } from '../../../core/models/content.model';
import { ProgressService } from '../../../core/services/progress.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="lesson-container" #scrollContainer (scroll)="onScroll()">
      <div class="lesson-header">
        <h1>{{content.titulo_tema}}</h1>
        <div class="progress-badge" [class.completed]="isCompleted">
          <lucide-icon [name]="isCompleted ? 'CheckCircle' : 'Clock'" size="16"></lucide-icon>
          {{isCompleted ? 'Concluído' : 'Em progresso (' + completionPercent + '%)'}}
        </div>
      </div>

      <div class="lesson-body" [innerHTML]="safeContent"></div>

      <div class="video-placeholder" *ngIf="hasVideo">
        <div class="mock-video-player">
          <lucide-icon name="Play" size="48"></lucide-icon>
          <p>Simulação de Player de Vídeo (90% de retenção necessária)</p>
          <div class="video-progress-bar">
            <div class="fill" [style.width]="videoProgress + '%'"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lesson-container { height: 100%; overflow-y: auto; padding: 2rem; background: var(--bg-card); border-radius: var(--radius); }
    .lesson-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    .progress-badge { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: var(--bg-main); color: var(--text-muted); }
    .progress-badge.completed { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .lesson-body { line-height: 1.8; color: var(--text-main); font-size: 1.1rem; }
    .mock-video-player { margin-top: 2rem; height: 300px; background: #000; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; position: relative; }
    .video-progress-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 6px; background: rgba(255,255,255,0.2); }
    .video-progress-bar .fill { height: 100%; background: var(--primary); transition: width 0.5s; }
  `]
})
export class LessonViewerComponent implements OnInit, OnDestroy {
  @Input() content!: Content;
  @Input() studentId!: string;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private progressService = inject(ProgressService);
  private sanitizer = inject(DomSanitizer);

  safeContent: SafeHtml = '';
  isCompleted = false;
  completionPercent = 0;
  videoProgress = 0;
  hasVideo = false;
  private timer: any;
  private startTime: number = Date.now();

  ngOnInit() {
    this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.content.conteudo_html || '');
    this.hasVideo = this.content.conteudo_html?.includes('iframe') || false;
    this.startTracking();
  }

  ngOnDestroy() {
    this.saveProgress();
    if (this.timer) clearInterval(this.timer);
  }

  private startTracking() {
    this.timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      
      if (this.hasVideo && this.videoProgress < 100) {
        this.videoProgress += 2; // Simulação de avanço de vídeo
      }

      this.updateCompletionStatus();
    }, 1000);
  }

  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.updateCompletionStatus();
  }

  private updateCompletionStatus() {
    const element = this.scrollContainer?.nativeElement;
    if (!element) return;

    // Lógica de Scroll
    const scrollPercent = (element.scrollTop + element.clientHeight) / element.scrollHeight * 100;
    
    // Lógica de Tempo (mínimo 30 segundos para textos curtos ou baseado na duração)
    const timePercent = Math.min(100, (Math.floor((Date.now() - this.startTime) / 1000) / 30) * 100);

    if (this.hasVideo) {
      this.completionPercent = Math.floor(this.videoProgress);
    } else {
      this.completionPercent = Math.floor((scrollPercent + timePercent) / 2);
    }

    if (this.completionPercent >= 90 && !this.isCompleted) {
      this.isCompleted = true;
      this.saveProgress();
    }
  }

  private async saveProgress() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    await this.progressService.updateProgress({
      id_aluno: this.studentId,
      id_conteudo: this.content.id,
      visualizado: this.isCompleted,
      porcentagem_concluida: this.completionPercent,
      tempo_total_segundos: elapsed
    });
  }
}