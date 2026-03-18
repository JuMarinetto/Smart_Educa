import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
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

        <!-- Progress -->
        <div class="progress-bar-container">
          <div class="progress-bar-fill" [style.width.%]="progressPercent"></div>
        </div>
        <p class="progress-label">Questão {{ currentIndex + 1 }} de {{ questions.length }}</p>

        <!-- Current Question -->
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

        <!-- Navigation -->
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

      <!-- SUBMITTED -->
      <div class="result-area" *ngIf="submitted">
        <div class="result-card">
          <div class="result-icon" [class.success]="passed" [class.failed]="!passed">
            <lucide-icon [name]="passed ? 'CheckCircle' : 'XCircle'" size="48"></lucide-icon>
          </div>
          
          <ng-container *ngIf="alreadyCompleted; else justCompleted">
            <h2>Avaliação já realizada</h2>
            <p>Você já concluiu esta avaliação. Confira sua nota abaixo.</p>
          </ng-container>
          <ng-template #justCompleted>
            <h2>{{ passed ? 'Parabéns, Aprovado!' : 'Reprovado' }}</h2>
            <p>{{ passed ? 'Você atingiu a nota mínima!' : 'Você não atingiu a nota mínima. Revise o conteúdo e tente novamente.' }}</p>
          </ng-template>

          <div class="score-display">
            <div class="score-circle" [class.pass]="passed" [class.fail]="!passed">
              <span class="score-value">{{ scoreObtained | number:'1.1-1' }}</span>
              <span class="score-divider">de {{ assessment?.nota_total }}</span>
            </div>
            <div class="score-details">
              <div class="score-row" *ngIf="questions.length > 0"><span>Acertos:</span><strong>{{ correctCount }} / {{ questions.length }}</strong></div>
              <div class="score-row"><span>Percentual:</span><strong>{{ scorePercent | number:'1.0-0' }}%</strong></div>
              <div class="score-row"><span>Nota de corte:</span><strong>{{ passingScore | number:'1.1-1' }}</strong></div>
              <div class="score-row"><span>Status:</span><strong [class.text-success]="passed" [class.text-danger]="!passed">{{ passed ? 'APROVADO' : 'REPROVADO' }}</strong></div>
            </div>
          </div>

          <div class="result-actions">
            <button class="btn-back" [routerLink]="['/student/assessments']" [queryParams]="{tab: 'completed'}">
              <lucide-icon name="ArrowLeft" size="18"></lucide-icon>
              Voltar às Avaliações
            </button>
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
    .loading-state lucide-icon { animation: spin 1s linear infinite; }
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

    /* EXAM AREA */
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

    /* NAV */
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
    .result-area { display: flex; justify-content: center; padding-top: 3rem; }
    .result-card { background: var(--bg-card, #1a1230); border: 1px solid var(--border, rgba(255,255,255,0.06)); border-radius: 16px; padding: 3rem; text-align: center; max-width: 500px; width: 100%; }
    .result-icon { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .result-icon.success { background: rgba(34,197,94,0.1); color: #22c55e; }
    .result-icon.failed { background: rgba(239,68,68,0.1); color: #ef4444; }
    .result-card h2 { margin-bottom: 0.5rem; }
    .result-card p { color: var(--text-muted, #8b82a8); font-size: 0.9rem; }

    .score-display { display: flex; align-items: center; gap: 2rem; margin: 1.5rem 0; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--border, rgba(255,255,255,0.06)); }
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

    .result-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 0.5rem; }
    .btn-back { display: inline-flex; align-items: center; gap: 8px; background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.2); color: var(--take-accent); padding: 0.7rem 1.2rem; border-radius: 10px; cursor: pointer; font-weight: 600; text-decoration: none; }
    .btn-back:hover { background: var(--take-accent); color: white; }
    .btn-back:hover { background: var(--take-accent); color: white; }
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
  answers: Record<string, string> = {}; // questionId -> alternativeId
  currentIndex = 0;
  isStarted = false;
  isSubmitting = false;
  submitted = false;
  alreadyCompleted = false;
  timeLeft = 0;
  timer: any;

  // --- Result ---
  scoreObtained = 0;
  correctCount = 0;
  scorePercent = 0;
  passingScore = 0;
  passed = false;

  get currentQuestion() {
    return this.questions[this.currentIndex] || null;
  }

  get progressPercent() {
    return this.questions.length > 0 ? ((this.currentIndex + 1) / this.questions.length) * 100 : 0;
  }

  get formattedTime() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  get answeredCount() {
    return Object.keys(this.answers).length;
  }

  ngOnInit() {
    const assessmentId = this.route.snapshot.paramMap.get('id');
    if (!assessmentId) {
      this.toastService.error('Avaliação não encontrada.');
      this.router.navigate(['/student/assessments']);
      return;
    }
    this.loadAssessment(assessmentId);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async loadAssessment(assessmentId: string) {
    this.loading = true;

    const profile = this.authService.getLoggedProfile();
    const studentId = profile?.id;

    if (studentId) {
      // Verifica se o aluno já finalizou essa prova (bypass e trava pro Result Screen)
      const { data: snaps } = await this.assessmentService.supabase
        .from('assessment_snapshots')
        .select('*')
        .eq('id_aluno', studentId)
        .eq('id_avaliacao_original', assessmentId)
        .not('status_aprovacao', 'is', null)
        .order('data_aplicacao', { ascending: false })
        .limit(1);

      if (snaps && snaps.length > 0) {
        const snap = snaps[0];
        this.assessmentService.getAllAssessments().subscribe(assessments => {
          this.assessment = assessments.find((a: any) => a.id === assessmentId) || null;
          const notaTotal = this.assessment?.nota_total || 10;

          this.scoreObtained = snap.nota_obtida || 0;
          this.passed = snap.status_aprovacao;
          this.passingScore = this.assessment?.nota_corte || (notaTotal * 0.6);
          this.scorePercent = notaTotal > 0 ? (this.scoreObtained / notaTotal) * 100 : 0;
          this.questions = [];

          this.alreadyCompleted = true;
          this.submitted = true;
          this.loading = false;
        });
        return;
      }
    }

    // Load assessment metadata
    this.assessmentService.getAllAssessments().subscribe(assessments => {
      this.assessment = assessments.find((a: any) => a.id === assessmentId) || null;
      if (!this.assessment) {
        this.toastService.error('Avaliação não encontrada.');
        this.loading = false;
        return;
      }
      if (this.assessment.duracao) {
        this.timeLeft = this.assessment.duracao * 60;
      }
    });

    // Load questions linked to this assessment
    this.assessmentService.getAssessmentQuestions(assessmentId).subscribe(linkedData => {
      const questionIds = linkedData.map((lq: any) => lq.id_questao);

      if (questionIds.length > 0) {
        this.assessmentService.getQuestionsWithAlternatives(questionIds).subscribe(data => {
          this.questions = data;
          this.loading = false;
        });
      } else {
        this.questions = [];
        this.loading = false;
      }
    });
  }

  start() {
    this.isStarted = true;
    this.currentIndex = 0;
    this.answers = {};

    // Start countdown if assessment has timer
    if (this.assessment?.cronometro && this.timeLeft > 0) {
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          this.submit();
        }
      }, 1000);
    }
  }

  selectAnswer(questionId: string, alternativeId: string) {
    this.answers[questionId] = alternativeId;
  }

  prevQuestion() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) this.currentIndex++;
  }

  goToQuestion(index: number) {
    this.currentIndex = index;
  }

  async submit() {
    if (this.isSubmitting) return;

    const unanswered = this.questions.length - this.answeredCount;
    if (unanswered > 0) {
      if (!confirm(`Você ainda tem ${unanswered} questão(ões) sem resposta. Deseja enviar mesmo assim?`)) {
        return;
      }
    }

    this.isSubmitting = true;
    if (this.timer) clearInterval(this.timer);

    try {
      const profile = this.authService.getLoggedProfile();
      const studentId = profile?.id || 'unknown';
      const assessmentId = this.assessment?.id;

      const snapshotId = await this.assessmentService.saveStudentAssessment(assessmentId, studentId, this.answers);

      // Calculate score
      this.correctCount = 0;
      for (const q of this.questions) {
        const selectedAltId = this.answers[q.id];
        if (selectedAltId && q.alternatives) {
          const correctAlt = q.alternatives.find((a: any) => a.is_correta);
          if (correctAlt && correctAlt.id === selectedAltId) {
            this.correctCount++;
          }
        }
      }

      const totalQuestions = this.questions.length;
      this.scorePercent = totalQuestions > 0 ? (this.correctCount / totalQuestions) * 100 : 0;
      const notaTotal = this.assessment?.nota_total || 10;

      let rawScore = totalQuestions > 0 ? (this.correctCount / totalQuestions) * notaTotal : 0;
      // Previne "numeric field overflow" do banco de dados (NUMERIC 4,2 suporta max 99.99)
      if (rawScore >= 100) rawScore = 99.99;
      this.scoreObtained = rawScore;

      this.passingScore = this.assessment?.nota_corte || (notaTotal * 0.6);
      this.passed = this.scoreObtained >= this.passingScore;

      // Update the snapshot with the calculated score
      const { error: updateError } = await this.assessmentService.supabase
        .from('assessment_snapshots')
        .update({ nota_obtida: this.scoreObtained, status_aprovacao: this.passed })
        .eq('id', snapshotId);

      if (updateError) {
        console.error('UpdateError: ', updateError);
        throw new Error(updateError.message || 'Erro ao salvar a nota final');
      }

      // Check and issue certificate if passed and linked to a course
      if (this.passed && this.assessment?.id_curso) {
        await this.progressService.checkAndIssueCertificate(studentId, this.assessment.id_curso);
      }

      this.submitted = true;
      this.toastService.success(this.passed ? 'Aprovado! Parabéns!' : 'Avaliação enviada. Você pode tentar novamente.');
    } catch (e: any) {
      console.error('Erro ao submeter avaliação:', e);
      this.toastService.error('Erro ao enviar avaliação: ' + (e.message || 'Erro inesperado'));
    } finally {
      this.isSubmitting = false;
    }
  }

}