import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

interface CatalogCourse {
  id: string;
  titulo: string;
  status: string;
  created_at: string;
  enrolled: boolean;
  enrolling?: boolean;
}

@Component({
  selector: 'app-student-catalog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="catalog">
      <!-- Header -->
      <section class="catalog-header">
        <div class="header-left">
          <h1>Explorar Cursos</h1>
          <p>Descubra novos cursos e amplie seus conhecimentos.</p>
        </div>
        <div class="header-search">
          <lucide-icon name="Search" size="18"></lucide-icon>
          <input
            type="text"
            placeholder="Buscar cursos..."
            [(ngModel)]="searchTerm"
            (input)="filterCourses()"
          />
        </div>
      </section>

      <!-- Filter Tabs -->
      <section class="filter-tabs">
        <button
          class="tab"
          [class.active]="activeFilter === 'all'"
          (click)="setFilter('all')"
        >
          Todos
          <span class="tab-count">{{ allCourses.length }}</span>
        </button>
        <button
          class="tab"
          [class.active]="activeFilter === 'available'"
          (click)="setFilter('available')"
        >
          Disponíveis
          <span class="tab-count">{{ availableCount }}</span>
        </button>
        <button
          class="tab"
          [class.active]="activeFilter === 'enrolled'"
          (click)="setFilter('enrolled')"
        >
          Matriculado
          <span class="tab-count">{{ enrolledCount }}</span>
        </button>
      </section>

      <!-- Loading -->
      <section class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Carregando cursos...</p>
      </section>

      <!-- Grid -->
      <section class="course-grid" *ngIf="!loading && filteredCourses.length > 0">
        <div
          class="course-card"
          *ngFor="let course of filteredCourses; let i = index"
        >
          <div class="card-thumb" [style.background]="getGradient(i)">
            <div class="thumb-icon">
              <lucide-icon name="BookOpen" size="32"></lucide-icon>
            </div>
            <span class="card-badge enrolled-badge" *ngIf="course.enrolled">
              <lucide-icon name="CheckCircle" size="12"></lucide-icon>
              Matriculado
            </span>
            <span class="card-badge available-badge" *ngIf="!course.enrolled">
              Disponível
            </span>
          </div>

          <div class="card-body">
            <h3 class="card-title">{{ course.titulo }}</h3>
            <div class="card-meta">
              <span>
                <lucide-icon name="Calendar" size="12"></lucide-icon>
                {{ course.created_at | date: 'dd/MM/yyyy' }}
              </span>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <a
                *ngIf="course.enrolled"
                class="btn-primary"
                [routerLink]="['/student/course-player', course.id]"
              >
                <lucide-icon name="Play" size="14"></lucide-icon>
                Acessar Curso
              </a>
              <button
                *ngIf="!course.enrolled"
                class="btn-enroll"
                [disabled]="course.enrolling"
                (click)="enroll(course)"
              >
                <lucide-icon
                  [name]="course.enrolling ? 'Loader2' : 'UserPlus'"
                  size="14"
                  [class.spin]="course.enrolling"
                ></lucide-icon>
                {{ course.enrolling ? 'Matriculando...' : 'Matricular-se' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Empty -->
      <section class="empty-state" *ngIf="!loading && filteredCourses.length === 0">
        <lucide-icon name="Search" size="48"></lucide-icon>
        <h3>Nenhum curso encontrado</h3>
        <p *ngIf="searchTerm">Tente buscar com outros termos.</p>
        <p *ngIf="!searchTerm">Nenhum curso disponível no momento.</p>
      </section>

      <!-- Enrollment Feedback -->
      <div class="toast" *ngIf="toastMessage" [class.error]="toastError">
        <lucide-icon [name]="toastError ? 'AlertCircle' : 'CheckCircle'" size="18"></lucide-icon>
        {{ toastMessage }}
      </div>
    </div>
  `,
  styles: [`
    :host {
      --cat-bg-card: var(--bg-card);
      --cat-border: var(--border);
      --cat-text: var(--text-main);
      --cat-text-muted: var(--text-muted);
      --cat-accent: var(--primary);
      --cat-radius: 14px;
      --cat-transition: var(--transition);
    }

    .catalog { max-width: 1200px; }

    /* ====== HEADER ====== */
    .catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .header-left h1 {
      font-size: 1.75rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }
    .header-left p {
      color: var(--cat-text-muted);
      font-size: 0.95rem;
    }

    .header-search {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--cat-bg-card);
      border: 1px solid var(--cat-border);
      border-radius: 12px;
      padding: 0.6rem 1rem;
      min-width: 280px;
      transition: var(--cat-transition);
    }
    .header-search:focus-within {
      border-color: var(--cat-accent);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
    }
    .header-search lucide-icon { color: var(--cat-text-muted); flex-shrink: 0; }
    .header-search input {
      border: none;
      background: transparent;
      outline: none;
      color: var(--cat-text);
      font-size: 0.9rem;
      width: 100%;
    }
    .header-search input::placeholder { color: var(--cat-text-muted); }

    /* ====== FILTER TABS ====== */
    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
    }
    .tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--cat-border);
      background: var(--cat-bg-card);
      color: var(--cat-text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--cat-transition);
    }
    .tab:hover { border-color: rgba(139, 92, 246, 0.3); color: var(--cat-text); }
    .tab.active {
      background: rgba(139, 92, 246, 0.12);
      border-color: rgba(139, 92, 246, 0.4);
      color: var(--cat-accent);
    }
    .tab-count {
      background: rgba(255,255,255,0.06);
      padding: 1px 7px;
      border-radius: 6px;
      font-size: 0.75rem;
    }
    .tab.active .tab-count {
      background: rgba(139, 92, 246, 0.2);
    }

    /* ====== LOADING ====== */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: var(--cat-text-muted);
    }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid rgba(139, 92, 246, 0.2);
      border-top-color: var(--cat-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ====== GRID ====== */
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .course-card {
      background: var(--cat-bg-card);
      border: 1px solid var(--cat-border);
      border-radius: 16px;
      overflow: hidden;
      transition: var(--cat-transition);
    }
    .course-card:hover {
      transform: translateY(-4px);
      border-color: rgba(139, 92, 246, 0.3);
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    }

    .card-thumb {
      height: 150px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thumb-icon {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      color: white;
      transition: var(--cat-transition);
    }
    .course-card:hover .thumb-icon { transform: scale(1.1); }

    .card-badge {
      position: absolute;
      bottom: 10px; left: 10px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .enrolled-badge {
      background: rgba(34, 197, 94, 0.85);
      color: white;
      backdrop-filter: blur(4px);
    }
    .available-badge {
      background: rgba(0,0,0,0.55);
      color: white;
      backdrop-filter: blur(4px);
    }

    .card-body { padding: 1rem 1.25rem 1.25rem; }
    .card-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-meta {
      display: flex; gap: 1rem;
      font-size: 0.75rem;
      color: var(--cat-text-muted);
      margin-bottom: 1rem;
    }
    .card-meta span { display: flex; align-items: center; gap: 4px; }

    .card-actions { display: flex; }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      justify-content: center;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      border: none;
      cursor: pointer;
      transition: var(--cat-transition);
      text-decoration: none;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
    }

    .btn-enroll {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      justify-content: center;
      background: rgba(34, 197, 94, 0.12);
      color: #22c55e;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.85rem;
      border: 1px solid rgba(34, 197, 94, 0.25);
      cursor: pointer;
      transition: var(--cat-transition);
    }
    .btn-enroll:hover:not(:disabled) {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.4);
    }
    .btn-enroll:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spin { animation: spin 1s linear infinite; }

    /* ====== EMPTY ====== */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--cat-text-muted);
    }
    .empty-state h3 {
      margin-top: 1rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--cat-text);
    }
    .empty-state p { margin-top: 0.5rem; font-size: 0.9rem; }

    /* ====== TOAST ====== */
    .toast {
      position: fixed;
      bottom: 2rem; right: 2rem;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #22c55e;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 999;
      backdrop-filter: blur(12px);
      animation: slideUp 0.3s ease-out;
    }
    .toast.error {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @media (max-width: 768px) {
      .catalog-header { flex-direction: column; }
      .header-search { min-width: initial; width: 100%; }
      .course-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StudentCatalogComponent implements OnInit {
  private courseService = inject(CourseService);
  private authService = inject(AuthService);

  allCourses: CatalogCourse[] = [];
  filteredCourses: CatalogCourse[] = [];
  searchTerm = '';
  activeFilter: 'all' | 'available' | 'enrolled' = 'all';
  loading = true;

  toastMessage = '';
  toastError = false;

  private studentId: string | undefined;

  private gradients = [
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #22c55e, #06b6d4)',
    'linear-gradient(135deg, #a855f7, #ec4899)',
  ];

  get availableCount(): number {
    return this.allCourses.filter(c => !c.enrolled).length;
  }
  get enrolledCount(): number {
    return this.allCourses.filter(c => c.enrolled).length;
  }

  ngOnInit() {
    this.studentId = this.authService.getLoggedProfile()?.id;
    this.loadCatalog();
  }

  private loadCatalog() {
    this.loading = true;

    const allCourses$ = this.courseService.getCourses();
    const myCourses$ = this.studentId
      ? this.courseService.getStudentCourses(this.studentId)
      : [];

    forkJoin({
      all: allCourses$,
      mine: Array.isArray(myCourses$) ? [myCourses$] : myCourses$
    }).subscribe({
      next: ({ all, mine }) => {
        const enrolledIds = new Set((mine as any[]).map((c: any) => c.id));
        this.allCourses = (all as any[])
          .filter(c => c.status === 'Ativo')
          .map(c => ({
            ...c,
            enrolled: enrolledIds.has(c.id),
          }));
        this.filterCourses();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Erro ao carregar cursos.', true);
      }
    });
  }

  setFilter(filter: 'all' | 'available' | 'enrolled') {
    this.activeFilter = filter;
    this.filterCourses();
  }

  filterCourses() {
    let result = [...this.allCourses];

    // Text search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c => c.titulo.toLowerCase().includes(term));
    }

    // Tab filter
    if (this.activeFilter === 'available') {
      result = result.filter(c => !c.enrolled);
    } else if (this.activeFilter === 'enrolled') {
      result = result.filter(c => c.enrolled);
    }

    this.filteredCourses = result;
  }

  enroll(course: CatalogCourse) {
    if (!this.studentId || course.enrolling) return;
    course.enrolling = true;

    // Find a class that contains this course and enroll
    this.courseService.getClassesForCourse(course.id).subscribe({
      next: async (classes) => {
        let classId: string;

        if (classes.length === 0) {
          // Auto-create a turma for this course
          const created = await this.courseService.autoCreateClassForCourse(course.id, course.titulo);
          if (!created) {
            course.enrolling = false;
            this.showToast('Erro ao preparar turma. Tente novamente.', true);
            return;
          }
          classId = created;
        } else {
          classId = classes[0].id_turma;
        }

        const { error } = await this.courseService.enrollStudent(classId, this.studentId!);

        if (error) {
          // Check if already enrolled (duplicate key)
          if ((error as any).code === '23505') {
            course.enrolled = true;
            this.showToast('Você já está matriculado neste curso!', false);
          } else {
            console.error('Enrollment error:', error);
            this.showToast('Erro ao matricular. Tente novamente.', true);
          }
        } else {
          course.enrolled = true;
          this.showToast(`Matrícula realizada em "${course.titulo}"!`, false);
        }
        course.enrolling = false;
      },
      error: (err) => {
        console.error('Error fetching classes:', err);
        course.enrolling = false;
        this.showToast('Erro ao buscar turmas.', true);
      }
    });
  }

  getGradient(i: number): string {
    return this.gradients[i % this.gradients.length];
  }

  private showToast(msg: string, isError: boolean) {
    this.toastMessage = msg;
    this.toastError = isError;
    setTimeout(() => { this.toastMessage = ''; }, 4000);
  }
}
