import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <h1>Meus Cursos</h1>
        <p>Gerencie seu progresso e continue de onde parou.</p>
      </header>

      <div class="course-grid">
        <app-ui-card [interactive]="true" *ngFor="let course of courses">
          <div class="course-card">
            <div class="course-image" [style.background-image]="'url(' + course.img + ')'"></div>
            <div class="course-info">
              <h3>{{course.title}}</h3>
              <p>{{course.desc}}</p>
              <div class="progress-container">
                <div class="progress-bar"><div class="progress-fill" [style.width]="course.progress + '%'"></div></div>
                <span>{{course.progress}}%</span>
              </div>
            </div>
          </div>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .page-header p { color: var(--text-muted); }
    .course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .course-image { height: 160px; background-size: cover; background-position: center; border-radius: 8px; margin-bottom: 1rem; }
    .course-info h3 { margin-bottom: 0.5rem; }
    .course-info p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
    .progress-container { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 600; }
    .progress-bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--success); }
  `]
})
export class CoursesComponent {
  courses = [
    { title: 'Segurança da Informação', desc: 'Fundamentos de proteção de dados.', progress: 85, img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400' },
    { title: 'Liderança Exponencial', desc: 'Gestão de times de alta performance.', progress: 30, img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400' }
  ];
}