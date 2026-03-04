import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { TreeViewComponent } from '../../../shared/components/tree-view/tree-view.component';
import { KnowledgeService } from '../../../core/services/knowledge.service';
import { KnowledgeArea } from '../../../core/models/knowledge-area.model';
import { Content } from '../../../core/models/content.model';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, UiCardComponent, TreeViewComponent],
  template: `
    <div class="container-fluid">
      <div class="sidebar-tree">
        <h3>Áreas</h3>
        <app-tree-view 
          [nodes]="areas" 
          [selectedId]="selectedArea?.id || null"
          (select)="onAreaSelect($event)">
        </app-tree-view>
      </div>

      <div class="content-main">
        <header class="page-header">
          <div>
            <h1>Biblioteca de Conteúdos</h1>
            <p *ngIf="selectedArea">Área: {{selectedArea.area_conhecimento}}</p>
            <p *ngIf="!selectedArea">Selecione uma área na árvore para gerenciar conteúdos.</p>
          </div>
          <button class="btn-primary" *ngIf="selectedArea?.permite_conteudo" (click)="showEditor = true">
            <lucide-icon name="Plus" size="18"></lucide-icon>
            Novo Conteúdo
          </button>
        </header>

        <div class="alert-info" *ngIf="selectedArea && !selectedArea.permite_conteudo">
          <lucide-icon name="Lock" size="18"></lucide-icon>
          Esta área é apenas estrutural. Selecione uma sub-área que permita conteúdo.
        </div>

        <div class="content-list" *ngIf="!showEditor">
          <app-ui-card *ngFor="let item of contents">
            <div class="content-row">
              <div class="content-info">
                <h3>{{item.titulo_tema}}</h3>
                <p>{{item.descricao}}</p>
                <div class="meta">
                  <span class="version">v{{item.versao}}</span>
                  <span class="date">{{item.created_at | date:'dd/MM/yyyy'}}</span>
                </div>
              </div>
              <div class="actions">
                <button class="btn-icon"><lucide-icon name="Edit" size="18"></lucide-icon></button>
              </div>
            </div>
          </app-ui-card>
        </div>

        <app-ui-card *ngIf="showEditor" class="editor-card">
          <div class="editor-header">
            <h3>Novo Conteúdo</h3>
            <button class="btn-close" (click)="showEditor = false">×</button>
          </div>
          <div class="form-group">
            <label>Título do Tema</label>
            <input type="text" placeholder="Ex: Introdução à LGPD">
          </div>
          <div class="form-group">
            <label>Conteúdo HTML (Editor)</label>
            <div class="rich-editor-placeholder">
              <div class="toolbar">
                <button class="tool">B</button>
                <button class="tool">I</button>
                <button class="tool">Link</button>
                <button class="tool">Video</button>
              </div>
              <textarea placeholder="Escreva seu conteúdo aqui... Suporta embeds de vídeo via iframe."></textarea>
            </div>
          </div>
          <div class="editor-actions">
            <button class="btn-outline" (click)="showEditor = false">Cancelar</button>
            <button class="btn-primary">Salvar Versão 1.0</button>
          </div>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [`
    .container-fluid { display: flex; min-height: calc(100vh - 40px); margin-left: 280px; }
    .sidebar-tree { width: 300px; border-right: 1px solid var(--border); padding: 2rem; background: var(--bg-card); }
    .sidebar-tree h3 { font-size: 1rem; margin-bottom: 1.5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .content-main { flex: 1; padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .btn-primary { background: var(--primary); color: white; padding: 0.8rem 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .alert-info { background: rgba(59, 130, 246, 0.1); color: var(--info); padding: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 12px; margin-bottom: 2rem; }
    .content-row { display: flex; justify-content: space-between; align-items: center; }
    .meta { display: flex; gap: 12px; margin-top: 8px; font-size: 0.8rem; }
    .version { color: var(--primary); font-weight: 700; }
    .rich-editor-placeholder { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .toolbar { background: var(--bg-main); padding: 8px; border-bottom: 1px solid var(--border); display: flex; gap: 8px; }
    .tool { padding: 4px 12px; border: 1px solid var(--border); border-radius: 4px; background: white; font-weight: bold; }
    textarea { width: 100%; min-height: 300px; padding: 1rem; border: none; outline: none; font-family: inherit; }
    .editor-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 2rem; }
    .btn-outline { border: 1px solid var(--border); padding: 0.8rem 1.5rem; border-radius: 8px; }
  `]
})
export class ContentsComponent implements OnInit {
  private knowledgeService = inject(KnowledgeService);
  
  areas: KnowledgeArea[] = [];
  contents: Content[] = [];
  selectedArea: KnowledgeArea | null = null;
  showEditor = false;

  ngOnInit() {
    this.knowledgeService.getAreas().subscribe(data => {
      // Simulação de estrutura em árvore para demonstração
      this.areas = this.buildTree(data);
    });
  }

  onAreaSelect(area: KnowledgeArea) {
    this.selectedArea = area;
    this.showEditor = false;
    if (area.permite_conteudo) {
      this.knowledgeService.getContentsByArea(area.id).subscribe(data => this.contents = data);
    } else {
      this.contents = [];
    }
  }

  private buildTree(data: KnowledgeArea[]): KnowledgeArea[] {
    // Lógica simples para transformar lista plana em árvore para o exemplo
    const map = new Map();
    data.forEach(item => map.set(item.id, { ...item, sub_areas: [] }));
    const tree: KnowledgeArea[] = [];
    data.forEach(item => {
      if (item.id_area_conhecimento_pai && map.has(item.id_area_conhecimento_pai)) {
        map.get(item.id_area_conhecimento_pai).sub_areas.push(map.get(item.id));
      } else {
        tree.push(map.get(item.id));
      }
    });
    return tree;
  }
}