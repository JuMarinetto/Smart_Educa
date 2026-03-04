import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { KnowledgeService } from '../../../core/services/knowledge.service';
import { KnowledgeArea } from '../../../core/models/knowledge-area.model';

@Component({
  selector: 'app-knowledge-areas',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Áreas de Conhecimento</h1>
          <p>Organize a hierarquia pedagógica da instituição.</p>
        </div>
        <button class="btn-primary">
          <lucide-icon name="Plus" size="18"></lucide-icon>
          Nova Área
        </button>
      </header>

      <div class="areas-grid">
        <app-ui-card *ngFor="let area of areas">
          <div class="area-item">
            <div class="area-info">
              <lucide-icon [name]="area.id_area_conhecimento_pai ? 'ChevronRight' : 'BookOpen'" size="20"></lucide-icon>
              <div>
                <h3>{{area.area_conhecimento}}</h3>
                <span class="badge" [class.active]="area.permite_conteudo">
                  {{area.permite_conteudo ? 'Permite Conteúdo' : 'Apenas Estrutura'}}
                </span>
              </div>
            </div>
            <div class="actions">
              <button class="btn-icon"><lucide-icon name="Edit" size="16"></lucide-icon></button>
              <button class="btn-icon danger"><lucide-icon name="Trash" size="16"></lucide-icon></button>
            </div>
          </div>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .areas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1rem; }
    .area-item { display: flex; justify-content: space-between; align-items: center; }
    .area-info { display: flex; align-items: center; gap: 1rem; }
    .area-info h3 { font-size: 1rem; margin-bottom: 4px; }
    .badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; background: var(--border); color: var(--text-muted); }
    .badge.active { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .actions { display: flex; gap: 8px; }
    .btn-icon { width: 32px; height: 32px; border-radius: 6px; background: var(--bg-main); display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
    .btn-icon.danger:hover { color: var(--danger); background: rgba(239, 68, 68, 0.1); }
  `]
})
export class KnowledgeAreasComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  areas: KnowledgeArea[] = [];

  ngOnInit() {
    this.knowledgeService.getAreas().subscribe(data => this.areas = data);
  }
}