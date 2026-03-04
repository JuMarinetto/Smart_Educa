import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { LessonViewerComponent } from '../lesson-viewer/lesson-viewer.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, LessonViewerComponent],
  template: `
    <div class="player-layout">
      <div class="sidebar">
        <div class="course-info">
          <h2>{{courseTitle}}</h2>
          <div class="overall-progress">
            <div class="bar"><div class="fill" [style.width]="overallProgress + '%'"></div></div>
            <span>{{overallProgress}}% concluído</span>
          </div>
        </div>

        <nav class="topics-nav">
          <div *ngFor="let topic of topics; let i = index" class="topic-group">
            <div class="topic-header" [class.locked]="isTopicLocked(i)">
              <lucide-icon [name]="isTopicLocked(i) ? 'Lock' : 'ChevronDown'" size="16"></lucide-icon>
              <span>{{topic.nome_topico}}</span>
            </div>
            
            <div class="lessons-list" *ngIf="!isTopicLocked(i)">
              <div *ngFor="let content of topic.course_contents" 
                   class="lesson-item"
                   [class.active]="selectedContent?.id === content.contents.id"
                   (click)="selectContent(content.contents)">
                <lucide-icon [name]="getContentIcon(content.contents.id)" size="14"></lucide-icon>
                <span>{{content.contents.titulo_tema}}</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <main class="content-area">
        <app-lesson-viewer 
          *ngIf="selectedContent" 
          [content]="selectedContent" 
          [studentId]="'mock-student-id'">
        </app-lesson-viewer>
        
        <div class="empty-state" *ngIf="!selectedContent">
          <lucide-icon name="BookOpen" size="48"></lucide-icon>
          <h3>Selecione uma aula para começar</h3>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .player-layout { display: flex; height: 100vh; margin-left: 280px; background: var(--bg-main); }
    .sidebar { width: 320px; border-right: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; }
    .course-info { padding: 1.5rem; border-bottom: 1px solid var(--border); }
    .course-info h2 { font-size: 1.1rem; margin-bottom: 1rem; }
    .overall-progress { font-size: 0.75rem; color: var(--text-muted); }
    .bar { height: 4px; background: var(--border); border-radius: 2px; margin-bottom: 4px; overflow: hidden; }
    .fill { height: 100%; background: var(--success); }
    
    .topics-nav { flex: 1; overflow-y: auto; padding: 1rem; }
    .topic-header { display: flex; align-items: center; gap: 10px; padding: 0.8rem; font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
    .topic-header.locked { color: var(--text-muted); opacity: 0.6; }
    
    .lessons-list { margin-left: 1.5rem; border-left: 1px solid var(--border); }
    .lesson-item { padding: 0.6rem 1rem; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--text-muted); transition: var(--transition); }
    .lesson-item:hover { color: var(--primary); background: rgba(37, 99, 235, 0.05); }
    .lesson-item.active { color: var(--primary); font-weight: 600; background: rgba(37, 99, 235, 0.1); border-radius: 0 20px 20px 0; }
    
    .content-area { flex: 1; padding: 2rem; overflow: hidden; }
    .empty-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 1rem; }
  `]
})
export class CoursePlayerComponent implements OnInit {
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private route = inject(ActivatedRoute);

  courseTitle = 'Carregando...';
  topics: any[] = [];
  selectedContent: any = null;
  overallProgress = 0;
  completedContentIds: Set<string> = new Set();

  ngOnInit() {
    const courseId = this.route.snapshot.params['id'] || 'mock-course-id';
    this.loadCourse(courseId);
  }

  loadCourse(id: string) {
    this.courseService.getCourseStructure(id).subscribe(data => {
      this.topics = data;
      this.courseTitle = data[0]?.courses?.titulo || 'Curso';
      // Simulação: Em produção, buscaria o progresso real do aluno aqui
    });
  }

  isTopicLocked(index: number): boolean {
    if (index === 0) return false;
    // Lógica: Tópico N está bloqueado se o Tópico N-1 não estiver 100% concluído
    // Para o MVP, vamos simular que apenas o primeiro está aberto
    return index > 0 && this.completedContentIds.size === 0;
  }

  selectContent(content: any) {
    this.selectedContent = content;
  }

  getContentIcon(id: string) {
    return this.completedContentIds.has(id) ? 'CheckCircle' : 'Play';
  }
}