import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { KnowledgeService } from '../../../core/services/knowledge.service';
import { Content } from '../../../core/models/content.model';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <div>
          <h1>Biblioteca de Conteúdos</h1>
          <p>Gerencie materiais didáticos e versões de documentos.</p>
        </div>
        <button class="btn-primary">
          <lucide-icon name="Plus" size="18"></lucide-icon>
          Novo Conteúdo
        </button>
      </header>

      <div class="content-list">
        <app-ui-card *ngFor="let item of contents">
          <div class="content-row">
            <div class="content-main">
              <div class="type-icon"><lucide-icon name="FileText" size="24"></lucide-icon></div>
              <div>
                <h3>{{item.titulo_tema}}</h3>
                <p>{{item.descricao}}</p>
                <div class="meta">
                  <span class="version">v{{item.versao}}</span>
                  <span class="date">Criado em: {{item.created_at | date:'dd/MM/yyyy'}}</span>
                </div>
              </div>
            </div>
            <div class="actions">
              <button class="btn-outline">Ver Histórico</button>
              <button class="btn-primary-sm">Editar</button>
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
    .content-list { display: flex; flex-direction: column; gap: 1rem; }
    .content-row { display: flex; justify-content: space-between; align-items: center; }
    .content-main { display: flex; gap: 1.5rem; align-items: center; }
    .type-icon { width: 48px; height: 48px; background: rgba(37, 99, 235, 0.1); color: var(--primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .content-main h3 { font-size: 1.1rem; margin-bottom: 4px; }
    .content-main p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px; }
    .meta { display: flex; gap: 12px; font-size: 0.75rem; font-weight: 600; }
    .version { color: var(--primary); background: rgba(37, 99, 235, 0.1); padding: 2px 6px; border-radius: 4px; }
    .date { color: var(--text-muted); }
    .actions { display: flex; gap: 12px; }
    .btn-outline { border: 1px solid var(--border); padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
    .btn-primary-sm { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
  `]
})
export class ContentsComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  contents: Content[] = [];

  ngOnInit() {
    // Exemplo: Carregando conteúdos (em um cenário real, você passaria o ID da área)
    this.knowledgeService.getContentsByArea('').subscribe(data => this.contents = data);
  }
}