import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { LessonViewerComponent } from '../lesson-viewer/lesson-viewer.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

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
          <div class="course-stats" *ngIf="topics.length > 0">
            <div class="stats-row">
              <lucide-icon name="CheckCircle" size="14"></lucide-icon>
              <span>{{completedContentIds.size}} / {{totalContents}} aulas</span>
            </div>
            <button class="btn-finish-course" 
                    *ngIf="overallProgress < 100"
                    (click)="finishCourse()">
              Finalizar Curso
            </button>
          </div>
        </div>

        <div class="sidebar-tabs">
          <button [class.active]="activeSidebarTab === 'aulas'" (click)="activeSidebarTab = 'aulas'">
            <lucide-icon name="List" size="14"></lucide-icon>
            Aulas
          </button>
          <button [class.active]="activeSidebarTab === 'recursos'" (click)="activeSidebarTab = 'recursos'">
            <lucide-icon name="Folder" size="14"></lucide-icon>
            Recursos
          </button>
        </div>

        <nav class="topics-nav" *ngIf="activeSidebarTab === 'aulas'">
          <div *ngFor="let topic of topics; let i = index" class="topic-group">
            <div class="topic-header" [class.locked]="isTopicLocked(i)">
              <lucide-icon [name]="isTopicLocked(i) ? 'Lock' : 'ChevronDown'" size="16"></lucide-icon>
              <span>{{topic.nome_topico}}</span>
            </div>
            
            <div class="lessons-list" *ngIf="!isTopicLocked(i)">
              <div *ngFor="let cc of topic.course_contents" 
                   class="lesson-item"
                   [class.active]="isItemActive(cc)"
                   [class.question-nav-item]="cc.tipo === 'questao'"
                   (click)="selectItem(cc)">
                <lucide-icon [name]="getItemIcon(cc)" size="14"></lucide-icon>
                <span>{{ getItemDisplayName(cc) }}</span>
              </div>
            </div>
          </div>
        </nav>

        <div class="resources-tab" *ngIf="activeSidebarTab === 'recursos'">
          <div class="empty-resources" *ngIf="!courseAttachments || courseAttachments.length === 0">
            <lucide-icon name="Info" size="32"></lucide-icon>
            <p>Nenhum material de apoio disponível para este curso.</p>
          </div>
          <div class="resource-list" *ngIf="courseAttachments && courseAttachments.length > 0">
            <a *ngFor="let res of courseAttachments" [href]="res.url" target="_blank" class="resource-item">
              <lucide-icon name="FileText" size="18"></lucide-icon>
              <div class="res-info">
                <span class="res-name">{{ res.name }}</span>
                <span class="res-meta" *ngIf="res.size">{{ (res.size / 1024 / 1024) | number:'1.1-1' }} MB</span>
              </div>
              <lucide-icon name="Download" size="16" class="dl-icon"></lucide-icon>
            </a>
          </div>
        </div>
      </div>

      <main class="content-area">
        <!-- Content viewer -->
        <app-lesson-viewer 
          *ngIf="selectedContent && !showCompletionScreen && !selectedQuestion" 
          [content]="selectedContent" 
          [studentId]="studentId"
          [courseId]="courseId"
          [isCompleted]="completedContentIds.has(selectedContent.id)"
          [isLastItem]="checkIsLastItem()"
          (progressUpdated)="onContentCompleted($event)"
          (nextItem)="goToNextItem()">
        </app-lesson-viewer>

        <!-- Inline Question Quiz -->
        <div class="quiz-container" *ngIf="selectedQuestion && !showCompletionScreen">
          <div class="quiz-card">
            <div class="quiz-header">
              <div class="quiz-icon">
                <lucide-icon name="HelpCircle" size="32"></lucide-icon>
              </div>
              <h2>Questão de Reforço</h2>
              <p class="quiz-subtitle">Teste seu conhecimento sobre o conteúdo estudado</p>
            </div>

            <div class="quiz-body">
              <div class="question-text">{{ selectedQuestion.enunciado }}</div>

              <div class="alternatives">
                <button *ngFor="let alt of selectedQuestion.alternatives; let ai = index"
                        class="alt-btn"
                        [class.selected]="selectedAlternativeId === alt.id"
                        [class.correct]="quizAnswered && alt.is_correta"
                        [class.wrong]="quizAnswered && selectedAlternativeId === alt.id && !alt.is_correta"
                        [disabled]="quizAnswered"
                        (click)="selectAlternative(alt)">
                  <span class="alt-letter">{{ getAlternativeLetter(ai) }}</span>
                  <span class="alt-text">{{ alt.texto }}</span>
                  <lucide-icon *ngIf="quizAnswered && alt.is_correta" name="CheckCircle" size="18" class="icon-correct"></lucide-icon>
                  <lucide-icon *ngIf="quizAnswered && selectedAlternativeId === alt.id && !alt.is_correta" name="XCircle" size="18" class="icon-wrong"></lucide-icon>
                </button>
              </div>

              <div class="quiz-feedback" *ngIf="quizAnswered">
                <div class="feedback-card" [class.success]="quizCorrect" [class.error]="!quizCorrect">
                  <lucide-icon [name]="quizCorrect ? 'CheckCircle' : 'AlertTriangle'" size="24"></lucide-icon>
                  <div>
                    <strong>{{ quizCorrect ? 'Parabéns! Resposta correta!' : 'Resposta incorreta.' }}</strong>
                    <p *ngIf="!quizCorrect">A alternativa correta está destacada em verde.</p>
                  </div>
                </div>
              </div>

              <div class="quiz-actions">
                <button class="btn-primary" (click)="confirmAnswer()" *ngIf="!quizAnswered && selectedAlternativeId">
                  Confirmar Resposta
                </button>
                <button class="btn-primary" (click)="goToNextItem()" *ngIf="quizAnswered">
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="completion-screen" *ngIf="showCompletionScreen">
          <div class="trophy-icon">
            <lucide-icon name="Award" size="64"></lucide-icon>
          </div>
          <h2>Parabéns! Você concluiu o curso.</h2>
          <p>Seu certificado já foi gerado e está disponível na sua conta.</p>
          <button class="btn-primary mt-4" (click)="goToCertificates()">
            Ver Meu Certificado
          </button>
        </div>
        
        <div class="empty-state" *ngIf="!selectedContent && !selectedQuestion && !showCompletionScreen">
          <lucide-icon name="BookOpen" size="48"></lucide-icon>
          <h3>Selecione uma aula para começar</h3>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .player-layout { display: flex; height: 100vh; background: var(--bg-main); }
    .sidebar { width: 320px; border-right: 1px solid var(--border); background: var(--bg-card); display: flex; flex-direction: column; }
    .course-info { padding: 1.5rem; border-bottom: 1px solid var(--border); }
    .course-info h2 { font-size: 1.1rem; margin-bottom: 1rem; }
    .overall-progress { font-size: 0.75rem; color: var(--text-muted); }
    .bar { height: 4px; background: var(--border); border-radius: 2px; margin-bottom: 4px; overflow: hidden; }
    .fill { height: 100%; background: var(--success); }
    
    .sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 1rem; }
    .sidebar-tabs button { flex: 1; padding: 0.75rem; border: none; background: transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border-bottom: 2px solid transparent; }
    .sidebar-tabs button.active { color: var(--primary); border-bottom-color: var(--primary); }

    .topics-nav { flex: 1; overflow-y: auto; padding: 1rem; }
    .topic-header { display: flex; align-items: center; gap: 10px; padding: 0.8rem; font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
    .topic-header.locked { color: var(--text-muted); opacity: 0.6; }
    
    .lessons-list { margin-left: 1.5rem; border-left: 1px solid var(--border); }
    .lesson-item { padding: 0.6rem 1rem; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--text-muted); transition: var(--transition); }
    .lesson-item:hover { color: var(--primary); background: rgba(37, 99, 235, 0.05); }
    .lesson-item.active { color: var(--primary); font-weight: 600; background: rgba(37, 99, 235, 0.1); border-radius: 0 20px 20px 0; }
    .lesson-item.question-nav-item { color: #f59e0b; }
    .lesson-item.question-nav-item:hover { color: #d97706; background: rgba(245, 158, 11, 0.05); }
    .lesson-item.question-nav-item.active { color: #d97706; background: rgba(245, 158, 11, 0.1); }
    
    .course-stats { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem; }
    .stats-row { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-muted); }
    .btn-finish-course {
      width: 100%;
      padding: 0.6rem;
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-finish-course:hover {
      background: rgba(16, 185, 129, 0.2);
      border-color: var(--success);
    }

    .confirm-finish-group {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0.5rem;
      background: rgba(37, 99, 235, 0.05);
      border-radius: 8px;
      border: 1px dashed var(--primary);
    }
    .confirm-finish-group span { font-size: 0.75rem; font-weight: 600; color: var(--primary); }
    .btn-confirm-yes {
      padding: 4px 10px;
      background: var(--success);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .btn-confirm-no {
      padding: 4px 10px;
      background: var(--border);
      color: var(--text-main);
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    
    .content-area { flex: 1; padding: 2rem; overflow-y: auto; display: flex; flex-direction: column; }
    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); gap: 1rem; }
    
    /* Quiz styles */
    .quiz-container { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding-bottom: 2rem; }
    .quiz-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; max-width: 700px; width: 100%; overflow: visible; animation: fadeIn 0.3s ease-out; }
    .quiz-header { text-align: center; padding: 2rem 2rem 1rem; background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(37, 99, 235, 0.05)); border-bottom: 1px solid var(--border); }
    .quiz-icon { width: 64px; height: 64px; border-radius: 50%; background: rgba(245, 158, 11, 0.15); color: #f59e0b; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .quiz-header h2 { font-size: 1.3rem; color: var(--text-main); margin-bottom: 0.25rem; }
    .quiz-subtitle { color: var(--text-muted); font-size: 0.85rem; }
    .quiz-body { padding: 2rem; }
    .question-text { font-size: 1.1rem; line-height: 1.7; color: var(--text-main); margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-main); border-radius: 8px; border-left: 3px solid #f59e0b; }

    .alternatives { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
    .alt-btn { display: flex; align-items: center; gap: 12px; padding: 1rem 1.25rem; border: 2px solid var(--border); border-radius: 10px; background: var(--bg-main); color: var(--text-main); cursor: pointer; font-size: 0.95rem; text-align: left; transition: all 0.2s; }
    .alt-btn:hover:not(:disabled) { border-color: var(--primary); background: rgba(37, 99, 235, 0.03); }
    .alt-btn.selected { border-color: var(--primary); background: rgba(37, 99, 235, 0.06); }
    .alt-btn.correct { border-color: #10b981; background: rgba(16, 185, 129, 0.08); }
    .alt-btn.wrong { border-color: #ef4444; background: rgba(239, 68, 68, 0.08); }
    .alt-btn:disabled { cursor: default; }
    .alt-letter { width: 32px; height: 32px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
    .alt-text { flex: 1; }
    .icon-correct { color: #10b981; }
    .icon-wrong { color: #ef4444; }

    .quiz-feedback { margin-bottom: 1.5rem; }
    .feedback-card { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 10px; animation: fadeIn 0.3s ease-out; }
    .feedback-card.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .feedback-card.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .feedback-card p { margin-top: 4px; font-size: 0.85rem; opacity: 0.8; }

    .quiz-actions { display: flex; justify-content: center; }

    .completion-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); padding: 3rem; animation: fadeIn 0.5s ease-out; }
    .trophy-icon { width: 120px; height: 120px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); color: var(--success); display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; }
    .completion-screen h2 { font-size: 2rem; color: var(--text-main); margin-bottom: 1rem; }
    .completion-screen p { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2rem; }
    .mt-4 { margin-top: 1.5rem; }
    
    .resources-tab { flex: 1; overflow-y: auto; padding: 1.5rem; }
    .empty-resources { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: var(--text-muted); opacity: 0.7; }
    .empty-resources p { margin-top: 1rem; font-size: 0.85rem; padding: 0 1rem; }
    
    .resource-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .resource-item { display: flex; align-items: center; gap: 12px; padding: 1rem; background: var(--bg-main); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: var(--text-main); transition: all 0.2s; }
    .resource-item:hover { border-color: var(--primary); background: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .res-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .res-name { font-size: 0.85rem; font-weight: 600; }
    .res-meta { font-size: 0.7rem; color: var(--text-muted); }
    .dl-icon { color: var(--text-muted); opacity: 0.5; }
    .resource-item:hover .dl-icon { color: var(--primary); opacity: 1; }

    .btn-primary { 
      background: var(--primary); 
      color: white; 
      padding: 0.75rem 1.5rem; 
      border-radius: 8px; 
      font-weight: 600; 
      border: none; 
      cursor: pointer; 
      transition: background 0.2s, transform 0.1s; 
    }
    .btn-primary:hover { 
      background: var(--primary-hover); 
      transform: translateY(-1px); 
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CoursePlayerComponent implements OnInit {
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  courseId = '';
  courseTitle = 'Carregando...';
  topics: any[] = [];
  courseAttachments: any[] = [];
  activeSidebarTab: 'aulas' | 'recursos' = 'aulas';
  selectedContent: any = null;
  selectedQuestion: any = null;
  overallProgress = 0;
  completedContentIds: Set<string> = new Set();
  answeredQuestionIds: Set<string> = new Set();
  studentId = '';
  showCompletionScreen = false;
  completedCount = 0;
  totalContents = 0;
  // Quiz state
  selectedAlternativeId: string | null = null;
  quizAnswered = false;
  quizCorrect = false;
  private activeItemCC: any = null;
  private activeItemIndex = -1;

  ngOnInit() {
    this.studentId = this.authService.getLoggedProfile()?.id || '';
    this.courseId = this.route.snapshot.params['id'];
    if (this.courseId) {
      this.loadCourse(this.courseId);
      this.restoreAnsweredQuestions();
    }
  }

  /** If a contentId queryParam was passed (e.g. from assessment review), select that item automatically */
  private tryDeepLinkContent() {
    const targetContentId = this.route.snapshot.queryParamMap.get('contentId');
    if (!targetContentId) return;
    for (const topic of this.topics) {
      if (!topic.course_contents) continue;
      for (const cc of topic.course_contents) {
        if (cc.tipo !== 'questao' && cc.contents?.id === targetContentId) {
          this.selectItem(cc);
          return;
        }
      }
    }
  }

  loadCourse(id: string) {
    this.courseService.getCourseStructure(id).subscribe(async (data: any) => {
      // Pre-process: sort course_contents by ordem and filter nulls
      this.topics = data.map((topic: any) => {
        if (topic.course_contents) {
          topic.course_contents = topic.course_contents
            .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
            .filter((cc: any) => {
              if (cc.tipo === 'questao') return cc.questions != null;
              return cc.contents != null;
            });
        }
        return topic;
      });
      this.courseTitle = data[0]?.courses?.titulo || 'Curso';
      this.courseAttachments = data[0]?.courses?.anexos || [];
      await this.loadProgress();
      this.tryDeepLinkContent();
    });
  }

  loadProgress(): Promise<void> {
    return new Promise(resolve => {
      if (!this.studentId || this.topics.length === 0) { resolve(); return; }

      const lessonIds: string[] = [];
      const questionIds: string[] = [];
      
      this.topics.forEach(t => {
        if (t.course_contents) {
          t.course_contents.forEach((cc: any) => {
            if (cc.tipo === 'questao') {
              if (cc.questions?.id) questionIds.push(cc.questions.id);
            } else {
              if (cc.contents?.id) lessonIds.push(cc.contents.id);
            }
          });
        }
      });

      const allActivityIds = [...lessonIds, ...questionIds];
      if (allActivityIds.length === 0) { resolve(); return; }

      this.progressService.getCourseProgress(this.studentId, lessonIds, this.courseId).subscribe(async progressData => {
        const fromDb = new Set<string>(
          progressData.filter(p => p.status === 'CONCLUIDO').map(p => p.id_conteudo)
        );
        // MERGE: keep any optimistically-added IDs even if the DB write hasn't committed yet
        this.completedContentIds = new Set([...fromDb, ...this.completedContentIds]);
        
        // Also sync answeredQuestionIds if they are in the progress list
        fromDb.forEach(id => {
          // If this ID belongs to a question, mark it as answered too
          this.topics.forEach(topic => {
            topic.course_contents?.forEach((cc: any) => {
              if (cc.tipo === 'questao' && cc.questions?.id === id) {
                this.answeredQuestionIds.add(id);
              }
            });
          });
        });

        this.totalContents = allActivityIds.length;
        const totalCompleted = this.completedContentIds.size + this.answeredQuestionIds.size;
        const newProgress = this.totalContents > 0 ? Math.min(100, Math.round((totalCompleted / this.totalContents) * 100)) : 0;

        if (newProgress === 100 && this.overallProgress < 100) {
          this.overallProgress = 100;
          this.handleCourseCompletion();
        } else {
          this.overallProgress = newProgress;
        }
        resolve();
      });
    });
  }

  async handleCourseCompletion() {
    try {
      const issued = await this.progressService.checkAndIssueCertificate(this.studentId, this.courseId);
      this.showCompletionScreen = true;
      if (issued) {
        this.toastService.success('Curso concluído! Certificado gerado com sucesso.');
      }
    } catch (e) {
      console.error('Erro ao gerar certificado', e);
    }
  }

  isTopicLocked(index: number): boolean {
    if (index === 0) return false;

    const previousTopic = this.topics[index - 1];
    if (!previousTopic || !previousTopic.course_contents) return false;

    const previousContentIds = previousTopic.course_contents
      .filter((cc: any) => !cc.tipo || cc.tipo === 'conteudo')
      .map((c: any) => c.contents?.id)
      .filter((id: string) => !!id);
    const completedPrevious = previousContentIds.filter((id: string) => this.completedContentIds.has(id));

    return completedPrevious.length < previousContentIds.length;
  }

  // ---- Item selection ----

  private getFlatItems(): any[] {
    return this.topics.flatMap(t => t.course_contents || []);
  }

  selectItem(cc: any) {
    this.showCompletionScreen = false;
    this.activeItemCC = cc;
    this.activeItemIndex = this.getFlatItems().indexOf(cc);

    if (cc.tipo === 'questao' && cc.questions) {
      this.selectedContent = null;
      this.selectedQuestion = cc.questions;
      this.selectedAlternativeId = null;
      this.quizAnswered = false;
      this.quizCorrect = false;
    } else if (cc.contents) {
      this.selectedQuestion = null;
      this.selectedContent = cc.contents;
    }
  }

  isItemActive(cc: any): boolean {
    return this.activeItemCC === cc;
  }

  getItemDisplayName(cc: any): string {
    if (cc.tipo === 'questao' && cc.questions) {
      const q = cc.questions;
      const title = q.titulo || q.enunciado;
      return title?.length > 40 ? title.substring(0, 40) + '...' : title || 'Questão';
    }
    return cc.contents?.titulo_tema || '(sem título)';
  }

  getItemIcon(cc: any): string {
    if (cc.tipo === 'questao') {
      return this.answeredQuestionIds.has(cc.questions?.id) ? 'CheckCircle' : 'HelpCircle';
    }
    return this.completedContentIds.has(cc.contents?.id) ? 'CheckCircle' : 'Play';
  }

  // ---- Quiz logic ----

  selectAlternative(alt: any) {
    if (!this.quizAnswered) {
      this.selectedAlternativeId = alt.id;
    }
  }

  getAlternativeLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  confirmAnswer() {
    if (!this.selectedAlternativeId || !this.selectedQuestion) return;

    const selectedAlt = this.selectedQuestion.alternatives?.find(
      (a: any) => a.id === this.selectedAlternativeId
    );
    this.quizCorrect = selectedAlt?.is_correta || false;
    this.quizAnswered = true;
    this.answeredQuestionIds.add(this.selectedQuestion.id);
    this.persistAnsweredQuestions();

    // Sincroniza com o banco de dados
    this.progressService.updateProgress({
      id_aluno: this.studentId,
      id_conteudo: this.selectedQuestion.id,
      id_curso: this.courseId,
      status: 'CONCLUIDO',
      porcentagem_concluida: 100
    });
  }

  /** Optimistically mark a content as complete in the sidebar immediately */
  onContentCompleted(contentId: string) {
    if (contentId) {
      this.completedContentIds = new Set([...this.completedContentIds, contentId]);
      // Recalculate progress bar immediately
      if (this.totalContents > 0) {
        this.overallProgress = Math.round((this.completedContentIds.size / this.totalContents) * 100);
      }
    }
    // Do NOT call loadProgress() here: it would race with the DB write and potentially
    // overwrite the optimistic state before Supabase commits the record.
    // Background sync will happen in goToNextItem().
  }

  /** Persist answered question IDs to localStorage for this course */
  private persistAnsweredQuestions() {
    try {
      const key = `answered_questions_${this.courseId}`;
      localStorage.setItem(key, JSON.stringify([...this.answeredQuestionIds]));
    } catch (e) { /* ignore storage errors */ }
  }

  /** Restore answered question IDs from localStorage */
  private restoreAnsweredQuestions() {
    try {
      const key = `answered_questions_${this.courseId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        this.answeredQuestionIds = new Set(JSON.parse(stored));
      }
    } catch (e) { /* ignore */ }
  }

  checkIsLastItem(): boolean {
    if (!this.topics?.length) return false;
    const flatItems = this.getFlatItems();
    if (flatItems.length === 0) return false;
    // Use index tracking to avoid stale object reference
    const idx = this.activeItemIndex >= 0 ? this.activeItemIndex : flatItems.indexOf(this.activeItemCC);
    return idx === flatItems.length - 1;
  }

  async goToNextItem() {
    if (!this.topics?.length) return;

    const flatItems = this.getFlatItems();
    const currentIndex = this.activeItemIndex >= 0 ? this.activeItemIndex : flatItems.indexOf(this.activeItemCC);

    if (currentIndex >= 0 && currentIndex < flatItems.length - 1) {
      this.selectItem(flatItems[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Refresh progress in background without blocking navigation
      this.loadProgress();
    } else {
      // End of course — show completion screen
      this.activeItemCC = null;
      this.activeItemIndex = -1;
      this.selectedContent = null;
      this.selectedQuestion = null;
      await this.loadProgress();
      this.showCompletionScreen = true;
    }
  }

  async finishCourse() {
    if (!confirm('Deseja marcar todas as aulas como concluídas e gerar seu certificado?')) return;
    
    try {
      this.toastService.info('Processando conclusão do curso...');
      const success = await this.progressService.completeAllCourseContent(this.studentId, this.courseId);
      
      if (success) {
        // Marcar tudo localmente para refletir na UI imediatamente
        this.topics.forEach(t => {
          t.course_contents?.forEach((cc: any) => {
            const id = cc.tipo === 'questao' ? cc.questions?.id : cc.contents?.id;
            if (id) {
              this.completedContentIds.add(id);
              if (cc.tipo === 'questao') {
                this.answeredQuestionIds.add(id);
              }
            }
          });
        });
        
        this.persistAnsweredQuestions();
        this.overallProgress = 100;
        await this.loadProgress();
        this.showCompletionScreen = true;
        this.toastService.success('Curso concluído com sucesso!');
      } else {
        this.toastService.error('Não foi possível finalizar o curso no momento.');
      }
    } catch (e) {
      console.error('Erro ao finalizar curso:', e);
      this.toastService.error('Ocorreu um erro ao tentar concluir o curso.');
    }
  }

  private async _getAllContentIds(): Promise<string[]> {
    const allIds: string[] = [];
    this.topics.forEach(t => {
      if (t.course_contents) {
        t.course_contents.forEach((cc: any) => {
          if ((!cc.tipo || cc.tipo === 'conteudo') && cc.contents) {
            allIds.push(cc.contents.id);
          }
        });
      }
    });
    return allIds;
  }

  goToCertificates() {
    this.router.navigate(['/student/certificates']);
  }
}