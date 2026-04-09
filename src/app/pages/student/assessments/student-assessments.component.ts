import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AssessmentService } from '../../../core/services/assessment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Assessment } from '../../../core/models/assessment.model';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-student-assessments',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="my-courses">
      <header class="page-header">
        <div>
          <h1>Avaliações</h1>
          <p>Acompanhe e realize as provas disponíveis para você.</p>
        </div>
      </header>

      <!-- TABS -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'available'" (click)="activeTab = 'available'">
          Disponíveis
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'completed'" (click)="activeTab = 'completed'">
          Finalizadas
        </button>
      </div>

      <!-- AVAILABLE ASSESSMENTS -->
      <ng-container *ngIf="activeTab === 'available'">
        <div class="course-list" *ngIf="assessments.length > 0">
          <div class="course-row" *ngFor="let assessment of assessments; let i = index"
               [routerLink]="['/student/assessment', assessment.id]">
            <div class="row-thumb" [style.background]="getGradient(i)">
              <lucide-icon name="FileCheck" size="20"></lucide-icon>
            </div>
            <div class="row-info">
              <h3>{{ assessment.nome }}</h3>
              <span class="row-meta">
                <lucide-icon name="Clock" size="12"></lucide-icon>
                {{ assessment.tipo }}
              </span>
            </div>
            
            <button class="btn-continue">
              <lucide-icon name="ChevronRight" size="18"></lucide-icon>
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="assessments.length === 0">
          <div class="empty-icon">
            <lucide-icon name="CheckCircle" size="48"></lucide-icon>
          </div>
          <h3>Tudo em dia!</h3>
          <p>Você não tem nenhuma avaliação pendente no momento.</p>
        </div>
      </ng-container>

      <!-- COMPLETED ASSESSMENTS -->
      <ng-container *ngIf="activeTab === 'completed'">
        <div class="course-list" *ngIf="completedAssessments.length > 0">
          <div class="course-row completed" *ngFor="let result of completedAssessments; let i = index"
               [routerLink]="['/student/assessment', result.avaliacao.id]">
            <div class="row-thumb" [class.passed-bg]="result.status_aprovacao" [class.failed-bg]="!result.status_aprovacao">
              <lucide-icon [name]="result.status_aprovacao ? 'Check' : 'X'" size="20"></lucide-icon>
            </div>
            <div class="row-info">
              <h3>{{ result.avaliacao?.nome || 'Avaliação Finalizada' }}</h3>
              <span class="row-meta">
                <lucide-icon name="Calendar" size="12"></lucide-icon>
                {{ result.data_aplicacao | date:'dd/MM/yyyy HH:mm' }}
              </span>
            </div>
            
            <div class="score-badge" [class.passed]="result.status_aprovacao" [class.failed]="!result.status_aprovacao">
              <span class="score-val">{{ result.nota_obtida | number:'1.1-1' }}</span>
              <span class="score-lbl">{{ result.status_aprovacao ? 'Aprovado' : 'Reprovado' }}</span>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="completedAssessments.length === 0">
          <div class="empty-icon">
            <lucide-icon name="FileText" size="48"></lucide-icon>
          </div>
          <h3>Nenhuma finalizada</h3>
          <p>Você ainda não concluiu nenhuma avaliação.</p>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    :host {
      --st-bg-card: var(--bg-card);
      --st-border: var(--border);
      --st-text: var(--text-main);
      --st-text-muted: var(--text-muted);
      --st-accent: var(--primary);
      --st-accent-glow: rgba(6, 182, 212, 0.25);
      --st-radius: 12px;
      --st-transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .my-courses { max-width: 900px; }

    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 800; }
    .page-header p { color: var(--st-text-muted); font-size: 0.9rem; margin-top: 0.25rem; }

    /* ====== TABS ====== */
    .tabs {
      display: flex; gap: 1rem; border-bottom: 1px solid var(--st-border);
      margin-bottom: 1.5rem; padding-bottom: 0.5rem;
    }
    .tab-btn {
      background: transparent; border: none; color: var(--st-text-muted);
      font-weight: 600; font-size: 0.95rem; cursor: pointer;
      padding: 0.5rem 0.5rem; transition: var(--st-transition);
      position: relative;
    }
    .tab-btn:hover { color: var(--st-text); }
    .tab-btn.active { color: var(--st-accent); }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: -0.5rem; left: 0;
      width: 100%; height: 2px; background: var(--st-accent);
      border-radius: 2px 2px 0 0;
    }

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
      border-color: rgba(6, 182, 212, 0.3);
      background: rgba(var(--bg-card), 0.5);
      transform: translateX(4px);
    }
    
    .course-row.completed:hover {
        border-color: var(--st-border);
        background: var(--st-bg-card);
        transform: none;
    }

    .row-thumb {
      width: 56px; height: 56px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white;
      flex-shrink: 0;
    }
    
    .passed-bg { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .failed-bg { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

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
      text-transform: capitalize;
    }

    .btn-continue {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: rgba(6, 182, 212, 0.1);
      border: 1px solid rgba(6, 182, 212, 0.2);
      color: var(--st-accent);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: var(--st-transition);
      flex-shrink: 0;
    }
    .btn-continue:hover { background: var(--st-accent); color: white; }

    .score-badge { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; }
    .score-val { font-size: 1.1rem; font-weight: 800; }
    .score-lbl { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .score-badge.passed { color: #22c55e; }
    .score-badge.failed { color: #ef4444; }

    /* ====== EMPTY STATE ====== */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--st-text-muted);
    }
    .empty-icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: rgba(6, 182, 212, 0.1);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      color: var(--st-accent);
    }
    .empty-state h3 { font-size: 1.1rem; color: var(--st-text); margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.9rem; margin-bottom: 1.5rem; }
  `]
})
export class StudentAssessmentsComponent implements OnInit {
  private assessmentService = inject(AssessmentService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  assessments: Assessment[] = [];
  completedAssessments: any[] = [];
  activeTab: 'available' | 'completed' = 'available';

  private gradients = [
    'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #22c55e, #06b6d4)',
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'completed') {
        this.activeTab = 'completed';
      }
    });

    const profile = this.authService.getLoggedProfile();

    if (profile?.id) {
      combineLatest([
        this.assessmentService.getAvailableAssessments(),
        this.assessmentService.getStudentCompletedAssessments(profile.id)
      ]).subscribe(([available, completed]) => {
        // As avaliações finalizadas são aquelas que possuem status_aprovacao definido
        this.completedAssessments = completed.filter(d => d.status_aprovacao !== null && d.status_aprovacao !== undefined);

        // Extrai os IDs originais das avaliações já finalizadas
        const completedIds = this.completedAssessments.map(c => c.id_avaliacao_original);

        // Remove da lista de 'Disponíveis' todas aquelas que já estão do lado das 'Finalizadas'
        this.assessments = available.filter(a => !completedIds.includes(a.id));
      });
    } else {
      // Fallback fallback caso o perfil demore a carregar
      this.assessmentService.getAvailableAssessments().subscribe(data => {
        this.assessments = data;
      });
    }
  }

  getGradient(i: number): string {
    return this.gradients[i % this.gradients.length];
  }
}
