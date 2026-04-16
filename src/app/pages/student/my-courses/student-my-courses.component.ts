import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CourseService } from '../../../core/services/course.service';
import { Course } from '../../../core/models/course.model';
import { ProgressService } from '../../../core/services/progress.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-my-courses',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="my-courses">
      <header class="page-header">
        <div>
          <h1>Meus Cursos</h1>
          <p>Acompanhe seu progresso nas formações matriculadas.</p>
        </div>
      </header>

      <!-- Course List -->
      <div class="course-list" *ngIf="courses.length > 0">
        <div class="course-row" *ngFor="let course of courses; let i = index"
             [routerLink]="['/student/course-player', course.id]">
          <div class="row-thumb" [style.background]="getGradient(i)">
            <lucide-icon name="Play" size="20"></lucide-icon>
          </div>
          <div class="row-info">
            <h3>{{ course.titulo }}</h3>
            <span class="row-meta">
              <lucide-icon name="Clock" size="12"></lucide-icon>
              Iniciar aula
            </span>
          </div>
          <div class="row-progress">
            <div class="progress-ring">
              <svg viewBox="0 0 36 36">
                <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="ring-fg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      [style.stroke-dasharray]="(courseProgress[course.id] || 0) + ', 100'" />
              </svg>
              <span class="ring-text">{{ courseProgress[course.id] || 0 }}%</span>
            </div>
          </div>
          <button class="btn-continue">
            <lucide-icon name="ChevronRight" size="18"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="empty-state" *ngIf="courses.length === 0">
        <div class="empty-icon">
          <lucide-icon name="BookOpen" size="48"></lucide-icon>
        </div>
        <h3>Nenhum curso matriculado</h3>
        <p>Explore o catálogo e encontre formações para começar.</p>
        <a class="btn-accent" routerLink="/student/catalog">
          <lucide-icon name="Compass" size="16"></lucide-icon>
          Explorar Catálogo
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --st-bg-card: var(--bg-card);
      --st-border: var(--border);
      --st-text: var(--text-main);
      --st-text-muted: var(--text-muted);
      --st-accent: var(--primary);
      --st-accent-glow: rgba(139, 92, 246, 0.25);
      --st-radius: 12px;
      --st-transition: var(--transition);
    }

    .my-courses { max-width: 900px; }

    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 800; }
    .page-header p { color: var(--st-text-muted); font-size: 0.9rem; margin-top: 0.25rem; }

    /* ====== COURSE ROWS ====== */
    .course-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .course-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--st-bg-card);
      border: 1px solid var(--st-border);
      border-radius: 14px;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: var(--st-transition);
      text-decoration: none;
      color: var(--st-text);
    }
    .course-row:hover {
      border-color: rgba(139,92,246,0.3);
      background: rgba(var(--primary), 0.05);
      transform: translateX(4px);
    }

    .row-thumb {
      width: 56px; height: 56px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .row-info { flex: 1; min-width: 0; }
    .row-info h3 {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row-meta {
      display: flex; align-items: center; gap: 4px;
      color: var(--st-text-muted);
      font-size: 0.75rem;
    }

    /* ====== PROGRESS RING ====== */
    .row-progress { flex-shrink: 0; }
    .progress-ring {
      width: 44px; height: 44px;
      position: relative;
    }
    .progress-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .ring-bg {
      fill: none;
      stroke: rgba(255,255,255,0.06);
      stroke-width: 3;
    }
    .ring-fg {
      fill: none;
      stroke: var(--st-accent);
      stroke-width: 3;
      stroke-linecap: round;
    }
    .ring-text {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--st-text-muted);
    }

    .btn-continue {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: rgba(139,92,246,0.1);
      border: 1px solid rgba(139,92,246,0.2);
      color: var(--st-accent);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: var(--st-transition);
      flex-shrink: 0;
    }
    .btn-continue:hover { background: var(--st-accent); color: white; }

    /* ====== EMPTY STATE ====== */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--st-text-muted);
    }
    .empty-icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(139,92,246,0.1);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      color: var(--st-accent);
    }
    .empty-state h3 { font-size: 1.1rem; color: var(--st-text); margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.9rem; margin-bottom: 1.5rem; }

    .btn-accent {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.88rem;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: var(--st-transition);
    }
    .btn-accent:hover { transform: translateY(-1px); box-shadow: 0 8px 24px var(--st-accent-glow); }

    @media (max-width: 768px) {
      .row-progress { display: none; }
    }
  `]
})
export class StudentMyCoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private authService = inject(AuthService);

  courses: Course[] = [];
  courseProgress: { [key: string]: number } = {};

  private gradients = [
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #22c55e, #06b6d4)',
  ];

  ngOnInit() {
    const studentId = this.authService.getLoggedProfile()?.id;
    if (studentId) {
      this.courseService.getStudentCourses(studentId).subscribe(data => {
        this.courses = data;
        this.courses.forEach(course => {
          this.loadProgressForCourse(course.id, studentId);
        });
      });
    }
  }

  loadProgressForCourse(courseId: string, studentId: string) {
    this.courseService.getCourseStructure(courseId).subscribe(topics => {
      let allContentIds: string[] = [];
      topics.forEach((t: any) => {
        if (t.course_contents) {
          t.course_contents.forEach((c: any) => {
            if ((!c.tipo || c.tipo === 'conteudo') && c.contents) {
              allContentIds.push(c.contents.id);
            }
          });
        }
      });

      if (allContentIds.length > 0) {
        this.progressService.getCourseProgress(studentId, allContentIds, courseId).subscribe(progressData => {
          const completedCount = progressData.filter(p => p.status === 'CONCLUIDO').length;
          this.courseProgress[courseId] = Math.round((completedCount / allContentIds.length) * 100);
        });
      } else {
        this.courseProgress[courseId] = 0;
      }
    });
  }

  getGradient(i: number): string {
    return this.gradients[i % this.gradients.length];
  }
}
