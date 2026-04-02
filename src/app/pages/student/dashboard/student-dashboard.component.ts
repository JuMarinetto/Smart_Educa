import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { CourseService } from '../../../core/services/course.service';
import { AssessmentService } from '../../../core/services/assessment.service';
import { Assessment } from '../../../core/models/assessment.model';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="dashboard">
      <!-- Hero / Welcome -->
      <section class="hero">
        <div class="hero-content">
          <h1>Olá, {{ studentName }}! 👋</h1>
          <p>Continue de onde parou ou explore novos conteúdos.</p>
          <div class="hero-actions">
            <button class="btn-accent" routerLink="/student/catalog">
              <lucide-icon name="Compass" size="16"></lucide-icon>
              Explorar Cursos
            </button>
            <button class="btn-ghost" routerLink="/student/my-courses">
              <lucide-icon name="Play" size="16"></lucide-icon>
              Continuar Estudando
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="visual-orb orb-1"></div>
          <div class="visual-orb orb-2"></div>
          <div class="visual-orb orb-3"></div>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats-row">
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(139,92,246,0.15);">
            <lucide-icon name="BookOpen" size="20" style="color:#8b5cf6"></lucide-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ courses.length }}</span>
            <span class="stat-label">Cursos Disponíveis</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(236,72,153,0.15);">
            <lucide-icon name="TrendingUp" size="20" style="color:#ec4899"></lucide-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">0</span>
            <span class="stat-label">Em Progresso</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(6,182,212,0.15);">
            <lucide-icon name="Award" size="20" style="color:#06b6d4"></lucide-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">0</span>
            <span class="stat-label">Concluídos</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: rgba(34,197,94,0.15);">
            <lucide-icon name="Clock" size="20" style="color:#22c55e"></lucide-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">0h</span>
            <span class="stat-label">Horas Estudadas</span>
          </div>
        </div>
      </section>

      <!-- Recent Courses -->
      <section class="section">
        <div class="section-header">
          <h2>Cursos Recentes</h2>
          <a routerLink="/student/catalog" class="see-all">Ver todos →</a>
        </div>

        <div class="course-grid" *ngIf="courses.length > 0">
          <div class="course-card" *ngFor="let course of courses.slice(0, 4); let i = index"
               [routerLink]="['/student/course-player', course.id]">
            <div class="card-thumb" [style.background]="getGradient(i)">
              <div class="thumb-overlay">
                <lucide-icon name="Play" size="28"></lucide-icon>
              </div>
              <span class="card-badge">{{ course.status }}</span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ course.titulo }}</h3>
              <div class="card-meta">
                <span><lucide-icon name="Layers" size="12"></lucide-icon> Módulos</span>
              </div>
              <div class="card-progress">
                <div class="progress-track">
                  <div class="progress-fill" style="width: 0%;"></div>
                </div>
                <span class="progress-text">0%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="courses.length === 0">
          <lucide-icon name="BookOpen" size="48"></lucide-icon>
          <p>Nenhum curso disponível ainda.</p>
          <a routerLink="/student/catalog" class="btn-accent" style="display: inline-flex; margin-top: 1rem;">Explorar Catálogo</a>
        </div>
      </section>

      <!-- Recommended Courses -->
      <section class="section" *ngIf="recommendedCourses.length > 0">
        <div class="section-header">
          <h2>Cursos Recomendados</h2>
          <a routerLink="/student/catalog" class="see-all">Ver catálogo →</a>
        </div>

        <div class="course-grid">
          <div class="course-card" *ngFor="let course of recommendedCourses.slice(0, 4); let i = index"
               [routerLink]="['/student/catalog']">
            <div class="card-thumb" [style.background]="getGradient(i + 4)">
              <div class="thumb-overlay">
                <lucide-icon name="Plus" size="28"></lucide-icon>
              </div>
              <span class="card-badge" style="background: rgba(34,197,94,0.8);">Novo</span>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ course.titulo }}</h3>
              <div class="card-meta">
                <span><lucide-icon name="Compass" size="12"></lucide-icon> Explorar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Available Exams -->
      <section id="assessments" class="section" *ngIf="assessments.length > 0">
        <div class="section-header">
          <h2>Avaliações Disponíveis</h2>
          <a routerLink="/student/assessments" class="see-all">Ver todas →</a>
        </div>

        <div class="assessment-grid">
          <div class="assessment-card" *ngFor="let assessment of assessments.slice(0, 4)"
               [routerLink]="['/student/assessment', assessment.id]">
            <div class="assessment-icon">
               <lucide-icon name="FileCheck" size="24"></lucide-icon>
            </div>
            <div class="assessment-info">
               <h3>{{ assessment.nome }}</h3>
               <span class="assessment-type">{{ assessment.tipo }}</span>
            </div>
            <lucide-icon name="ChevronRight" size="20" class="arrow-icon"></lucide-icon>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --st-bg: var(--bg-main);
      --st-bg-card: var(--bg-card);
      --st-bg-card-hover: rgba(139, 92, 246, 0.05);
      --st-border: var(--border);
      --st-text: var(--text-main);
      --st-text-muted: var(--text-muted);
      --st-accent: var(--primary);
      --st-accent-glow: rgba(139, 92, 246, 0.25);
      --st-radius: 12px;
      --st-transition: var(--transition);
    }

    .dashboard { max-width: 1200px; }

    /* ====== HERO ====== */
    .hero {
      position: relative;
      background: var(--st-bg-card);
      border: 1px solid var(--st-border);
      border-radius: 20px;
      padding: 2.5rem;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    .hero-content { position: relative; z-index: 2; }
    .hero h1 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
    .hero p { color: var(--st-text-muted); font-size: 1rem; margin-bottom: 1.5rem; }

    .hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }

    .btn-accent {
      display: flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.88rem;
      border: none;
      cursor: pointer;
      transition: var(--st-transition);
      text-decoration: none;
    }
    .btn-accent:hover { transform: translateY(-1px); box-shadow: 0 8px 24px var(--st-accent-glow); }

    .btn-ghost {
      display: flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--st-border);
      color: var(--st-text);
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: var(--st-transition);
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: var(--st-accent); }

    .hero-visual {
      position: absolute;
      right: -40px; top: -40px;
      width: 300px; height: 300px;
    }
    .visual-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.4;
    }
    .orb-1 { width: 200px; height: 200px; background: #8b5cf6; top: 0; right: 0; }
    .orb-2 { width: 120px; height: 120px; background: #ec4899; top: 80px; right: 100px; }
    .orb-3 { width: 100px; height: 100px; background: #06b6d4; top: 40px; right: 20px; }

    /* ====== STATS ====== */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--st-bg-card);
      border: 1px solid var(--st-border);
      border-radius: var(--st-radius);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: var(--st-transition);
    }
    .stat-card:hover { border-color: rgba(139,92,246,0.2); }
    .stat-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 800; line-height: 1; }
    .stat-label { font-size: 0.75rem; color: var(--st-text-muted); margin-top: 4px; font-weight: 500; }

    /* ====== SECTIONS ====== */
    .section { margin-bottom: 2rem; }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1.25rem;
    }
    .section-header h2 { font-size: 1.2rem; font-weight: 700; }
    .see-all {
      color: var(--st-accent);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: var(--st-transition);
    }
    .see-all:hover { text-decoration: underline; }

    /* ====== COURSE GRID ====== */
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .course-card {
      background: var(--st-bg-card);
      border: 1px solid var(--st-border);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: var(--st-transition);
      text-decoration: none;
      color: var(--st-text);
    }
    .course-card:hover {
      transform: translateY(-4px);
      border-color: rgba(139,92,246,0.3);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .card-thumb {
      height: 150px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .thumb-overlay {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      color: white;
      opacity: 0;
      transition: var(--st-transition);
    }
    .course-card:hover .thumb-overlay { opacity: 1; transform: scale(1.1); }

    .card-badge {
      position: absolute;
      bottom: 8px; left: 8px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-body { padding: 1rem 1.25rem 1.25rem; }
    .card-title {
      font-size: 0.95rem;
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
      color: var(--st-text-muted);
      margin-bottom: 0.75rem;
    }
    .card-meta span { display: flex; align-items: center; gap: 4px; }

    .card-progress { display: flex; align-items: center; gap: 8px; }
    .progress-track {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.06);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--st-accent);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .progress-text { font-size: 0.7rem; color: var(--st-text-muted); font-weight: 600; }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--st-text-muted);
    }
    .empty-state p { margin-top: 1rem; }

    /* ====== ASSESSMENTS ====== */
    .assessment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .assessment-card {
      background: var(--st-bg-card);
      border: 1px solid var(--st-border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: var(--st-transition);
      color: var(--st-text);
      text-decoration: none;
    }
    .assessment-card:hover {
      transform: translateY(-2px);
      border-color: rgba(6, 182, 212, 0.4);
      background: var(--st-bg-card-hover);
    }
    .assessment-icon {
      width: 48px; height: 48px;
      border-radius: 10px;
      background: rgba(6, 182, 212, 0.15);
      color: #06b6d4;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .assessment-info { flex: 1; }
    .assessment-info h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.25rem; }
    .assessment-type { font-size: 0.75rem; color: var(--st-text-muted); text-transform: capitalize; }
    .arrow-icon { color: var(--st-text-muted); opacity: 0; transition: var(--st-transition); transform: translateX(-10px); }
    .assessment-card:hover .arrow-icon { opacity: 1; transform: translateX(0); color: #06b6d4; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .course-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private assessmentService = inject(AssessmentService);
  private authService = inject(AuthService);

  courses: any[] = [];
  recommendedCourses: any[] = [];
  assessments: Assessment[] = [];

  private gradients = [
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #22c55e, #06b6d4)',
    'linear-gradient(135deg, #a855f7, #ec4899)',
  ];

  ngOnInit() {
    const studentId = this.authService.getLoggedProfile()?.id;
    if (studentId) {
      forkJoin({
        mine: this.courseService.getStudentCourses(studentId),
        all: this.courseService.getCourses()
      }).subscribe(({ mine, all }) => {
        this.courses = (mine as any[]).filter((c: any) => c.status === 'Ativo');
        const enrolledIds = new Set((mine as any[]).map((c: any) => c.id));
        this.recommendedCourses = (all as any[])
          .filter((c: any) => c.status === 'Ativo' && !enrolledIds.has(c.id));
      });
    } else {
      this.courseService.getCourses().subscribe(data => {
        this.recommendedCourses = (data as any[]).filter((c: any) => c.status === 'Ativo');
      });
    }

    this.assessmentService.getAvailableAssessments().subscribe(data => {
      this.assessments = data;
    });
  }

  get studentName(): string {
    const nome = this.authService.getLoggedProfile()?.nome || 'Aluno';
    // Usa só o primeiro nome para não ficar longo
    return nome.split(' ')[0];
  }

  getGradient(i: number): string {
    return this.gradients[i % this.gradients.length];
  }
}
