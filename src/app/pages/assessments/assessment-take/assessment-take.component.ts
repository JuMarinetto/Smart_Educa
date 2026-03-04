import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AssessmentService } from '../../../core/services/assessment.service';
import { StudentAssessment } from '../../../core/models/assessment.model';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-assessment-take',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="container">
      <div class="assessment-header" *ngIf="!isStarted">
        <h1>Avaliação Final</h1>
        <p>Leia as instruções antes de começar. O tempo será validado pelo servidor.</p>
        
        <div class="eligibility-alert" *ngIf="lastAttempt?.aprovado === false">
          <lucide-icon name="AlertCircle" size="24"></lucide-icon>
          <div>
            <h4>Acesso Bloqueado</h4>
            <p>Você foi reprovado na última tentativa. Revise os conteúdos das seguintes áreas:</p>
            <ul class="review-links">
              <li *ngFor="let area of lastAttempt?.reprovas_por_area">
                <a routerLink="/admin/contents" [queryParams]="{area: area}">Revisar Conteúdo: {{area}}</a>
              </li>
            </ul>
          </div>
        </div>

        <button class="btn-start" [disabled]="lastAttempt?.aprovado === false" (click)="start()">
          Iniciar Avaliação
        </button>
      </div>

      <div class="exam-area" *ngIf="isStarted">
        <div class="timer-bar">
          <lucide-icon name="Clock" size="18"></lucide-icon>
          <span>Tempo Restante: {{formattedTime}}</span>
        </div>

        <div class="question-card">
          <!-- Renderização das questões do snapshot -->
          <h3>Questão 1 de 10</h3>
          <p class="enunciado">Qual o principal objetivo da LGPD?</p>
          <div class="alternatives">
            <div class="alt-item"><input type="radio" name="q1"> Proteção de dados pessoais</div>
            <div class="alt-item"><input type="radio" name="q1"> Aumento de impostos</div>
          </div>
        </div>

        <div class="exam-footer">
          <button class="btn-primary" (click)="submit()">Finalizar e Enviar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; max-width: 800px; }
    .eligibility-alert { background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 1.5rem; border-radius: 12px; display: flex; gap: 1rem; margin: 2rem 0; }
    .review-links { margin-top: 1rem; }
    .review-links a { color: var(--danger); font-weight: 700; text-decoration: underline; }
    .btn-start { background: var(--primary); color: white; padding: 1rem 2rem; border-radius: 8px; font-weight: 700; width: 100%; }
    .timer-bar { background: var(--bg-card); padding: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; font-weight: 700; color: var(--primary); }
    .question-card { background: var(--bg-card); padding: 2rem; border-radius: 12px; border: 1px solid var(--border); }
    .alternatives { display: flex; flex-direction: column; gap: 12px; margin-top: 1.5rem; }
    .alt-item { padding: 1rem; border: 1px solid var(--border); border-radius: 8px; display: flex; gap: 12px; }
    .exam-footer { margin-top: 2rem; display: flex; justify-content: flex-end; }
  `]
})
export class AssessmentTakeComponent implements OnInit, OnDestroy {
  private assessmentService = inject(AssessmentService);
  
  isStarted = false;
  lastAttempt: StudentAssessment | null = null;
  timeLeft = 3600; // 60 min
  timer: any;

  ngOnInit() {
    this.assessmentService.getEligibility('mock-student', 'mock-exam').subscribe(data => {
      this.lastAttempt = data;
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  start() {
    this.isStarted = true;
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) this.timeLeft--;
    }, 1000);
  }

  get formattedTime() {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  submit() {
    // Lógica de submissão
  }
}