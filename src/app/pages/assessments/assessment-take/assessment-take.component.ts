import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AssessmentService } from '../../../core/services/assessment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-assessment-take',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="take-wrapper">
      <!-- LOADING -->
      <div class="loading-state" *ngIf="loading">
        <lucide-icon name="Loader2" size="32"></lucide-icon>
        <p>Carregando avaliação...</p>
      </div>

      <!-- PRE-START SCREEN -->
      <div class="pre-start" *ngIf="!loading && !isStarted && assessment && !submitted">
        <div class="pre-card">
          <div class="pre-icon">
            <lucide-icon name="FileCheck" size="40"></lucide-icon>
          </div>
          <h1>{{ assessment.nome }}</h1>
          <p class="pre-subtitle">Leia as instruções antes de iniciar.</p>

          <div class="info-grid">
            <div class="info-item">
              <lucide-icon name="Tag" size="16"></lucide-icon>
              <span>Tipo: <strong>{{ assessment.tipo }}</strong></span>
            </div>
            <div class="info-item">
              <lucide-icon name="Star" size="16"></lucide-icon>
              <span>Nota Total: <strong>{{ assessment.nota_total }}</strong></span>
            </div>
            <div class="info-item" *ngIf="assessment.duracao">
              <lucide-icon name="Clock" size="16"></lucide-icon>
              <span>Duração: <strong>{{ assessment.duracao }} min</strong></span>
            </div>
            <div class="info-item">
              <lucide-icon name="HelpCircle" size="16"></lucide-icon>
              <span>Questões: <strong>{{ questions.length }}</strong></span>
            </div>
          </div>

          <button class="btn-start" (click)="start()" [disabled]="questions.length === 0">
            <lucide-icon name="Play" size="20"></lucide-icon>
            Iniciar Avaliação
          </button>
          <p class="warn-text" *ngIf="questions.length === 0">Esta avaliação não possui questões cadastradas.</p>
        </div>
      </div>

      <!-- EXAM IN PROGRESS -->
      <div class="exam-area" *ngIf="isStarted && !submitted">
        <div class="exam-top-bar">
          <h2>{{ assessment?.nome }}</h2>
          <div class="timer" *ngIf="assessment?.cronometro">
            <lucide-icon name="Clock" size="18"></lucide-icon>
            <span>{{ formattedTime }}</span>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-fill" [style.width.%]="progressPercent"></div>
        </div>
        <p class="progress-label">Questão {{ currentIndex + 1 }} de {{ questions.length }}</p>

        <div class="question-card" *ngIf="currentQuestion">
          <div class="q-header">
            <span class="q-num">{{ currentIndex + 1 }}</span>
            <h3>{{ currentQuestion.titulo || 'Questão' }}</h3>
          </div>
          <p class="q-enunciado">{{ currentQuestion.enunciado }}</p>

          <div class="alternatives">
            <label class="alt-item" *ngFor="let alt of currentQuestion.alternatives || []"
                   [class.selected]="answers[currentQuestion.id] === alt.id"
                   (click)="selectAnswer(currentQuestion.id, alt.id)">
              <div class="alt-radio" [class.active]="answers[currentQuestion.id] === alt.id"></div>
              <span>{{ alt.texto }}</span>
            </label>
          </div>
        </div>

        <div class="exam-nav">
          <button class="btn-nav" (click)="prevQuestion()" [disabled]="currentIndex === 0">
            <lucide-icon name="ChevronLeft" size="18"></lucide-icon>
            Anterior
          </button>

          <div class="q-dots">
            <span class="dot" *ngFor="let q of questions; let i = index"
                  [class.current]="i === currentIndex"
                  [class.answered]="answers[q.id]"
                  (click)="goToQuestion(i)">{{ i + 1 }}</span>
          </div>

          <button class="btn-nav" *ngIf="currentIndex < questions.length - 1" (click)="nextQuestion()">
            Próxima
            <lucide-icon name="ChevronRight" size="18"></lucide-icon>
          </button>
          <button class="btn-submit" *ngIf="currentIndex === questions.length - 1" (click)="submit()" [disabled]="isSubmitting">
            <lucide-icon name="Send" size="18"></lucide-icon>
            Finalizar
          </button>
        </div>
      </div>

      <!-- RESULT SCREEN -->
      <div class="result-area" *ngIf="submitted">
        <div class="result-card">
          <div class="result-icon" [class.success]="passed" [class.failed]="!passed">
            <lucide-icon [name]="passed ? 'CheckCircle' : 'XCircle'" size="48"></lucide-icon>
          </div>

          <h2>{{ passed ? 'Parabéns, Aprovado!' : 'Reprovado' }}</h2>
          <p>{{ passed ? 'Você atingiu a nota mínima exigida!' : 'Você não atingiu a nota mínima. Revise o conteúdo e tente novamente.' }}</p>

          <!-- Score geral -->
          <div class="score-display">
            <div class="score-circle" [class.pass]="passed" [class.fail]="!passed">
              <span class="score-value">{{ scoreObtained | number:'1.1-1' }}</span>
              <span class="score-divider">de {{ assessment?.nota_total }}</span>
            </div>
            <div class="score-details">
              <div class="score-row" *ngIf="!alreadyCompleted">
                <span>Acertos:</span><strong>{{ correctCount }} / {{ questions.length }}</strong>
              </div>
              <div class="score-row"><span>Percentual:</span><strong>{{ scorePercent | number:'1.0-0' }}%</strong></div>
              <div class="score-row"><span>Nota de corte:</span><strong>{{ passingScore | number:'1.1-1' }}</strong></div>
              <div class="score-row">
                <span>Status:</span>
                <strong [class.text-success]="passed" [class.text-danger]="!passed">
                  {{ passed ? 'APROVADO' : 'REPROVADO' }}
                </strong>
              </div>
            </div>
          </div>

          <!-- Notas por Módulo/Conteúdo -->
          <div class="module-scores" *ngIf="moduleScores.length > 0">
            <h3 class="module-scores-title">
              <lucide-icon name="BookOpen" size="16"></lucide-icon>
              Desempenho por Módulo
            </h3>
            <div class="module-row" *ngFor="let mod of moduleScores"
                 [class.mod-pass]="mod.passed" [class.mod-fail]="!mod.passed">
              <div class="mod-info">
                <span class="mod-name">{{ mod.nome }}</span>
                <span class="mod-status-badge" [class.badge-pass]="mod.passed" [class.badge-fail]="!mod.passed">
                  {{ mod.passed ? 'OK' : 'Abaixo do mínimo' }}
                </span>
              </div>
              <div class="mod-bar-wrap">
                <div class="mod-bar-track">
                  <div class="mod-bar-fill"
                       [class.bar-pass]="mod.passed" [class.bar-fail]="!mod.passed"
                       [style.width.%]="mod.maxScore > 0 ? (mod.obtained / mod.maxScore) * 100 : 0"></div>
                  <div class="mod-bar-min" *ngIf="mod.required > 0"
                       [style.left.%]="mod.maxScore > 0 ? (mod.required / mod.maxScore) * 100 : 60"
                       title="Mínimo: {{ mod.required | number:'1.1-1' }}"></div>
                </div>
                <span class="mod-score-text">{{ mod.obtained | number:'1.1-1' }} / {{ mod.maxScore | number:'1.1-1' }}</span>
              </div>
            </div>
          </div>

          <!-- Revisar Conteúdo (quando reprovado) -->
          <div class="review-prompt" *ngIf="!passed">
            <div class="review-prompt-header">
              <lucide-icon name="BookOpen" size="20"></lucide-icon>
              <strong>Revise o conteúdo antes de tentar novamente</strong>
            </div>

            <!-- Ainda não revisou -->
            <ng-container *ngIf="!hasReviewed">
              <p class="review-prompt-text">
                Para liberar uma nova tentativa, você precisa primeiro visitar o
                material de estudo do curso relacionado.
              </p>
              <!-- Com curso vinculado: botão que leva ao curso -->
              <button class="btn-review" *ngIf="relatedCourseId || firstFailedCourseId" (click)="goToCourseReview()">
                <lucide-icon name="ExternalLink" size="16"></lucide-icon>
                Revisar Conteúdo
              </button>
              <!-- Sem curso vinculado: confirmação manual -->
              <button class="btn-review-confirm" *ngIf="!relatedCourseId && !firstFailedCourseId" (click)="markReviewed()">
                <lucide-icon name="Check" size="16"></lucide-icon>
                Confirmar que revisei o conteúdo
              </button>
            </ng-container>

            <!-- Já revisou -->
            <div class="review-done" *ngIf="hasReviewed">
              <lucide-icon name="CheckCircle" size="16"></lucide-icon>
              Revisão concluída! Você já pode tentar novamente.
            </div>
          </div>

          <!-- Ações -->
          <div class="result-actions">
            <!-- Tentar Novamente: só liberado após revisar o curso -->
            <button class="btn-retry" *ngIf="!passed"
                    [disabled]="!hasReviewed"
                    [title]="!hasReviewed ? 'Revise o conteúdo do curso acima para liberar' : ''"
                    (click)="resetForRetry()">
              <lucide-icon name="RefreshCw" size="18"></lucide-icon>
              Tentar Novamente
            </button>

            <a class="btn-back" [routerLink]="['/student/assessments']">
              <lucide-icon name="ArrowLeft" size="18"></lucide-icon>
              {{ passed ? 'Voltar às Avaliações' : 'Ver Minhas Avaliações' }}
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --take-accent: #06b6d4;
      --take-accent-glow: rgba(6, 182, 212, 0.2);
    }

    .take-wrapper { max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* LOADING */
    .loading-state { text-align: center; padding: 4rem; color: var(--text-muted); }
    .loading-state lucide-icon { animation: spin 1s linear infinite; display: block; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* PRE-START */
    .pre-start { display: flex; justify-content: center; padding-top: 2rem; }
    .pre-card { background: var(--bg-card, #1a1230); border: 1px solid var(--border, rgba(255,255,255,0.06)); border-radius: 16px; padding: 3rem 2.5rem; text-align: center; max-width: 550px; width: 100%; }
    .pre-icon { width: 80px; height: 80px; border-radius: 50%; background: var(--take-accent-glow); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--take-accent); }
    .pre-card h1 { font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem; }
    .pre-subtitle { color: var(--text-muted, #8b82a8); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 2rem; text-align: left; }
    .info-item { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; color: var(--text-muted, #8b82a8); padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .info-item strong { color: var(--text-main, #e8e4f0); }
    .btn-start { width: 100%; padding: 1rem; border-radius: 12px; border: none; background: linear-gradient(135deg, #06b6d4, #0ea5e9); color: white; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
    .btn-start:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px var(--take-accent-glow); }
    .btn-start:disabled { opacity: 0.5; cursor: not-allowed; }
    .warn-text { color: #f59e0b; font-size: 0.85rem; margin-top: 1rem; }

    /* EXAM */
    .exam-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .exam-top-bar h2 { font-size: 1.1rem; font-weight: 700; }
    .timer { display: flex; align-items: center; gap: 6px; background: rgba(6,182,212,0.1); color: var(--take-accent); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem; }
    .progress-bar-container { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-bar-fill { height: 100%; background: var(--take-accent); transition: width 0.3s; border-radius: 4px; }
    .progress-label { font-size: 0.8rem; color: var(--text-muted, #8b82a8); margin-bottom: 1.5rem; }
    .question-card { background: var(--bg-card, #1a1230); border: 1px solid var(--border, rgba(255,255,255,0.06)); border-radius: 14px; padding: 2rem; }
    .q-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; }
    .q-num { width: 36px; height: 36px; border-radius: 10px; background: var(--take-accent-glow); color: var(--take-accent); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
    .q-header h3 { font-size: 1rem; font-weight: 600; }
    .q-enunciado { font-size: 0.95rem; line-height: 1.6; color: var(--text-main, #e8e4f0); margin-bottom: 1.5rem; }
    .alternatives { display: flex; flex-direction: column; gap: 0.6rem; }
    .alt-item { display: flex; align-items: center; gap: 12px; padding: 0.9rem 1rem; border: 1px solid var(--border, rgba(255,255,255,0.06)); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .alt-item:hover { border-color: rgba(6,182,212,0.3); background: rgba(6,182,212,0.03); }
    .alt-item.selected { border-color: var(--take-accent); background: rgba(6,182,212,0.08); }
    .alt-radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--border, rgba(255,255,255,0.15)); flex-shrink: 0; transition: all 0.2s; }
    .alt-radio.active { border-color: var(--take-accent); background: var(--take-accent); box-shadow: inset 0 0 0 3px var(--bg-card, #1a1230); }
    .alt-item span { font-size: 0.9rem; }
    .exam-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 1.5rem; gap: 1rem; }
    .btn-nav { display: flex; align-items: center; gap: 6px; background: var(--bg-card, #1a1230); border: 1px solid var(--border, rgba(255,255,255,0.06)); color: var(--text-main, #e8e4f0); padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .btn-nav:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-submit { display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #06b6d4, #0ea5e9); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
    .btn-submit:disabled { opacity: 0.5; }
    .q-dots { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
    .dot { width: 28px; height: 28px; border-radius: 6px; background: rgba(255,255,255,0.05); color: var(--text-muted, #8b82a8); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .dot.current { background: var(--take-accent); color: white; }
    .dot.answered:not(.current) { background: rgba(6,182,212,0.15); color: var(--take-accent); }

    /* RESULT */
    .result-area { display: flex; justify-content: center; padding-top: 2rem; }
    .result-card { background: var(--bg-card, #1a1230); border: 1px solid var(--border, rgba(255,255,255,0.06)); border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 560px; width: 100%; }
    .result-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .result-icon.success { background: rgba(34,197,94,0.1); color: #22c55e; }
    .result-icon.failed { background: rgba(239,68,68,0.1); color: #ef4444; }
    .result-card h2 { margin-bottom: 0.5rem; font-size: 1.4rem; }
    .result-card > p { color: var(--text-muted, #8b82a8); font-size: 0.9rem; margin-bottom: 0; }

    .score-display { display: flex; align-items: center; gap: 2rem; margin: 1.5rem 0; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--border, rgba(255,255,255,0.06)); text-align: left; }
    .score-circle { text-align: center; min-width: 100px; }
    .score-value { font-size: 2.2rem; font-weight: 800; display: block; }
    .score-divider { font-size: 0.8rem; color: var(--text-muted, #8b82a8); }
    .score-circle.pass .score-value { color: #22c55e; }
    .score-circle.fail .score-value { color: #ef4444; }
    .score-details { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
    .score-row { display: flex; justify-content: space-between; font-size: 0.88rem; }
    .score-row span { color: var(--text-muted, #8b82a8); }
    .text-success { color: #22c55e !important; }
    .text-danger { color: #ef4444 !important; }

    /* MODULE SCORES */
    .module-scores { margin: 0 0 1.5rem; text-align: left; }
    .module-scores-title { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted, #8b82a8); margin-bottom: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; }
    .module-row { padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 0.5rem; border: 1px solid transparent; transition: all 0.2s; }
    .mod-pass { background: rgba(34,197,94,0.04); border-color: rgba(34,197,94,0.12); }
    .mod-fail { background: rgba(239,68,68,0.04); border-color: rgba(239,68,68,0.12); }
    .mod-info { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
    .mod-name { font-size: 0.88rem; font-weight: 600; color: var(--text-main, #e8e4f0); }
    .mod-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 20px; }
    .badge-pass { background: rgba(34,197,94,0.15); color: #22c55e; }
    .badge-fail { background: rgba(239,68,68,0.15); color: #ef4444; }
    .mod-bar-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .mod-bar-track { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 4px; position: relative; overflow: visible; }
    .mod-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .bar-pass { background: #22c55e; }
    .bar-fail { background: #ef4444; }
    .mod-bar-min { position: absolute; top: -3px; width: 2px; height: 12px; background: #f59e0b; border-radius: 2px; transform: translateX(-50%); }
    .mod-score-text { font-size: 0.78rem; font-weight: 600; color: var(--text-muted, #8b82a8); white-space: nowrap; }

    /* ACTIONS */
    /* REVIEW PROMPT */
    .review-prompt { margin: 1.5rem 0 0; padding: 1.25rem 1.5rem; background: rgba(245,158,11,0.06); border: 1px solid rgba(245,158,11,0.25); border-radius: 12px; text-align: left; }
    .review-prompt-header { display: flex; align-items: center; gap: 10px; color: #f59e0b; margin-bottom: 0.5rem; font-size: 0.95rem; }
    .review-prompt-text { font-size: 0.85rem; color: var(--text-muted, #8b82a8); margin: 0 0 1rem; line-height: 1.5; }
    .btn-review { display: inline-flex; align-items: center; gap: 8px; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.35); color: #f59e0b; padding: 0.65rem 1.1rem; border-radius: 9px; cursor: pointer; font-weight: 700; text-decoration: none; font-size: 0.88rem; transition: all 0.2s; }
    .btn-review:hover { background: rgba(245,158,11,0.2); }
    .btn-review-confirm { display: inline-flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; padding: 0.65rem 1.1rem; border-radius: 9px; cursor: pointer; font-weight: 700; font-size: 0.88rem; transition: all 0.2s; }
    .btn-review-confirm:hover { background: rgba(34,197,94,0.15); }
    .review-done { display: inline-flex; align-items: center; gap: 6px; color: #22c55e; font-weight: 600; font-size: 0.88rem; }

    .result-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
    .btn-back { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: var(--text-muted, #8b82a8); padding: 0.7rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 600; text-decoration: none; font-size: 0.88rem; transition: all 0.2s; }
    .btn-back:hover { background: rgba(255,255,255,0.08); color: var(--text-main, #e8e4f0); }
    .btn-retry { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #06b6d4, #0ea5e9); border: none; color: white; padding: 0.7rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 0.88rem; transition: all 0.2s; }
    .btn-retry:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px var(--take-accent-glow); }
    .btn-retry:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  `]
})
export class AssessmentTakeComponent implements OnInit, OnDestroy {
  private assessmentService = inject(AssessmentService);
  private authService = inject(AuthService);
  private progressService = inject(ProgressService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = true;
  assessment: any = null;
  questions: any[] = [];
  answers: Record<string, string> = {};
  currentIndex = 0;
  isStarted = false;
  isSubmitting = false;
  submitted = false;
  alreadyCompleted = false;
  timeLeft = 0;
  private timer: any;

  // Result state
  scoreObtained = 0;
  correctCount = 0;
  scorePercent = 0;
  passingScore = 0;
  passed = false;
  hasReviewed = false; // libera o botão Tentar Novamente
  relatedCourseId: string | null = null;

  // Desempenho por módulo/conteúdo
  moduleScores: { nome: string; obtained: number; required: number; maxScore: number; passed: boolean }[] = [];
  firstFailedContentId: string | null = null;  // para deep-link na revisão
  firstFailedCourseId: string | null = null;   // curso do conteudo reprovado

  private assessmentId: string | null = null;
  private reviewedKey: string = '';
  private routerSub: Subscription | null = null;

  get currentQuestion() { return this.questions[this.currentIndex] || null; }
  get progressPercent() { return this.questions.length > 0 ? ((this.currentIndex + 1) / this.questions.length) * 100 : 0; }
  get answeredCount() { return Object.keys(this.answers).length; }

  get formattedTime() {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  ngOnInit() {
    this.assessmentId = this.route.snapshot.paramMap.get('id');
    if (!this.assessmentId) {
      this.toastService.error('Avaliação não encontrada.');
      this.router.navigate(['/student/assessments']);
      return;
    }
    this.reviewedKey = `review_done_${this.assessmentId}`;

    // Verifica imediatamente se acabamos de voltar de uma revisão
    if (localStorage.getItem(this.reviewedKey) === 'true') {
      this.hasReviewed = true;
      localStorage.removeItem(this.reviewedKey);
    }

    // Escuta eventos de navegação para casos de SPA (troca de rota sem reconstrução total)
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (localStorage.getItem(this.reviewedKey) === 'true') {
          this.hasReviewed = true;
          localStorage.removeItem(this.reviewedKey);
        }
      });

    this.loadAssessment(this.assessmentId);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  async loadAssessment(assessmentId: string) {
    this.loading = true;

    const profile = this.authService.getLoggedProfile();
    const studentId = profile?.id;

    if (studentId) {
      // Verifica última tentativa finalizada do aluno
      const { data: snaps } = await this.assessmentService.getLastSnapshot(studentId, assessmentId);

      if (snaps && snaps.length > 0) {
        const snap = snaps[0];
        
        // Carrega o pacote completo (Assessment + Questões) para exibir os nomes dos módulos
        forkJoin({
          assessment: this.assessmentService.getAssessmentById(assessmentId),
          questions: this.assessmentService.getQuestionsForAssessment(assessmentId)
        }).subscribe(({ assessment, questions }) => {
          if (!assessment) {
            this.loading = false;
            return;
          }
          this.assessment = assessment;
          this.questions = questions;
          this.relatedCourseId = assessment.id_curso || null; // Garantido
          this.scoreObtained = snap.nota_obtida || 0;
          this.passed = snap.status_aprovacao ?? false;
          this.passingScore = assessment.nota_corte || (assessment.nota_total * 0.6);
          this.scorePercent = assessment.nota_total > 0 ? (this.scoreObtained / assessment.nota_total) * 100 : 0;
          this.alreadyCompleted = this.passed;
          this.submitted = true;
          this.loading = false;
          
          // Calcula correctCount para o template
          this._calculateCorrectCountOffline();

          if (snap.score_por_area) {
            this._buildModuleScoresFromSnap(snap, assessment);
          }
        });
        return;
      }
    }

    // Carrega metadados e questões em paralelo
    forkJoin({
      assessment: this.assessmentService.getAssessmentById(assessmentId),
      questions: this.assessmentService.getQuestionsForAssessment(assessmentId)
    }).subscribe({
      next: ({ assessment, questions }) => {
        if (!assessment) {
          this.toastService.error('Avaliação não encontrada.');
          this.loading = false;
          return;
        }

        this.assessment = assessment;
        this.relatedCourseId = assessment.id_curso || null;
        if (assessment.duracao) this.timeLeft = assessment.duracao * 60;
        this.questions = questions;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar avaliação:', err);
        this.toastService.error('Erro ao carregar dados da avaliação.');
        this.loading = false;
      }
    });
  }

  async start() {
    this.loading = true;
    try {
      const profile = this.authService.getLoggedProfile();
      if (!profile) throw new Error('Usuário não autenticado');

      // Cria o snapshot oficial no banco ANTES de começar (Fluxo Seguro)
      const snapshot = await this.assessmentService.startAssessment(this.assessment.id, profile.id);
      if (!snapshot) throw new Error('Erro ao iniciar tentativa de avaliação.');

      this.currentSnapshotId = snapshot.id;
      this.isStarted = true;
      this.currentIndex = 0;
      this.answers = {};

      if (this.assessment?.cronometro && this.timeLeft > 0) {
        this.timer = setInterval(() => {
          if (this.timeLeft > 0) { 
            this.timeLeft--; 
          } else { 
            this.submit(); 
          }
        }, 1000);
      }
    } catch (err: any) {
      this.toastService.error(err.message || 'Erro ao iniciar avaliação.');
    } finally {
      this.loading = false;
    }
  }

  selectAnswer(questionId: string, alternativeId: string) {
    this.answers[questionId] = alternativeId;
  }

  prevQuestion() { if (this.currentIndex > 0) this.currentIndex--; }
  nextQuestion() { if (this.currentIndex < this.questions.length - 1) this.currentIndex++; }
  goToQuestion(i: number) { this.currentIndex = i; }

  resetForRetry() {
    this.submitted = false;
    this.isStarted = false;
    this.alreadyCompleted = false;
    this.hasReviewed = false; // exige nova revisão
    this.answers = {};
    this.currentIndex = 0;
    this.moduleScores = [];
    this.firstFailedContentId = null;
    this.scoreObtained = 0;
    this.correctCount = 0;
    this.scorePercent = 0;
    this.passed = false;
    if (this.timer) clearInterval(this.timer);
    if (this.assessment?.duracao) this.timeLeft = this.assessment.duracao * 60;
  }

  goToCourseReview() {
    const courseId = this.firstFailedCourseId || this.relatedCourseId;
    if (!courseId) {
      this.markReviewed();
      return;
    }

    // Salva flag para quando voltar
    localStorage.setItem(this.reviewedKey, 'true');

    // Navega para o player, preferencialmente no conteúdo que falhou
    if (this.firstFailedContentId) {
      this.router.navigate(['/student/course', courseId], { queryParams: { contentId: this.firstFailedContentId } });
    } else {
      this.router.navigate(['/student/course', courseId]);
    }
  }

  markReviewed() {
    this.hasReviewed = true;
    this.toastService.info('Revisão confirmada. Você já pode tentar a avaliação novamente.');
  }

  async submit() {
    if (this.isSubmitting) return;

    const unanswered = this.questions.length - this.answeredCount;
    if (unanswered > 0 && !confirm(`Você tem ${unanswered} questão(ões) sem resposta. Deseja enviar mesmo assim?`)) return;

    this.isSubmitting = true;
    if (this.timer) clearInterval(this.timer);

    try {
      const profile = this.authService.getLoggedProfile();
      if (!profile) throw new Error('Usuário não autenticado');

      // Prepara respostas no formato esperado pela RPC
      const formattedAnswers = Object.entries(this.answers).map(([qId, altId]) => ({
        question_id: qId,
        selected_alternative_id: altId
      }));

      // 1. Submissão via RPC (Cálculo Seguro no Servidor)
      const result = await this.assessmentService.submitAssessment(this.currentSnapshotId!, formattedAnswers);
      
      // 2. Mapeia resultados da RPC para o estado do componente
      this.scoreObtained = result.nota_final;
      this.passed = result.aprovado;
      this.scorePercent = this.assessment.nota_total > 0 ? (this.scoreObtained / this.assessment.nota_total) * 100 : 0;
      this.passingScore = this.assessment.nota_corte || (this.assessment.nota_total * 0.6);
      
      // 3. Calcula acertos offline para exibição visual
      this._calculateCorrectCountOffline();

      // 4. Reconstrói módulos a partir do score_por_area retornado pela RPC
      this._buildModuleScoresFromSnap(result, this.assessment);

      // 5. Verifica certificado se aprovado (usando a nova RPC otimizada internamente)
      if (this.passed && this.assessment?.id_curso) {
        await this.progressService.checkAndIssueCertificate(profile.id, this.assessment.id_curso);
      }

      this.submitted = true;
      this.toastService.success(this.passed ? 'Aprovado! Parabéns!' : 'Avaliação enviada. Revise o conteúdo e tente novamente.');

    } catch (e: any) {
      console.error('Erro ao submeter avaliação:', e);
      this.toastService.error('Erro ao enviar avaliação: ' + (e?.message || 'Erro inesperado'));
    } finally {
      this.isSubmitting = false;
    }
  }

  private currentSnapshotId: string | null = null;

  private _calculateCorrectCountOffline() {
    this.correctCount = 0;
    this.questions.forEach(q => {
      const selectedAltId = this.answers[q.id];
      const correctAlt = q.alternatives?.find((a: any) => a.is_correta);
      if (selectedAltId && correctAlt && selectedAltId === correctAlt.id) {
        this.correctCount++;
      }
    });
  }

  private _buildModuleScoresFromSnap(snap: any, assessment: any) {
    const scores = snap.score_por_area || {};
    const regras = assessment.regras_nota_minima_conteudo || {};
    
    this.moduleScores = Object.entries(scores).map(([areaId, score]: [string, any]) => {
      const q = this.questions.find(quest => quest.id_conteudo === areaId);
      const nome = q?.contents?.titulo_tema || (areaId === 'null' ? 'Geral' : 'Módulo');
      const required = regras[areaId] || 0;
      
      return {
        nome,
        obtained: score,
        required,
        maxScore: assessment.nota_total,
        passed: score >= required
      };
    });

    // Se falhou em algum módulo, guarda o ID para o botão Revisar
    if (!this.passed) {
      const failedMod = this.moduleScores.find(m => !m.passed);
      if (failedMod) {
        const q = this.questions.find(quest => (quest.contents?.titulo_tema || quest.id_conteudo) === failedMod.nome);
        this.firstFailedContentId = q?.id_conteudo || null;
        this.firstFailedCourseId = q?.contents?.id_curso || assessment.id_curso || null;
      }
    }
  }
}