import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { KnowledgeArea } from '../../../core/models/knowledge-area.model';

@Component({
  selector: 'app-tree-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="tree-node" *ngFor="let node of nodes">
      <div class="node-content" 
           [class.selected]="selectedId === node.id"
           (click)="onSelect(node)">
        <lucide-icon 
          [name]="node.sub_areas?.length ? (expanded[node.id] ? 'ChevronDown' : 'ChevronRight') : 'Dot'" 
          size="16"
          (click)="toggle($event, node.id)">
        </lucide-icon>
        <lucide-icon [name]="node.permite_conteudo ? 'FileText' : 'Folder'" size="16" class="type-icon"></lucide-icon>
        <span>{{node.area_conhecimento}}</span>
      </div>
      
      <div class="sub-nodes" *ngIf="expanded[node.id] && node.sub_areas?.length">
        <app-tree-view 
          [nodes]="node.sub_areas || []" 
          [selectedId]="selectedId"
          (select)="select.emit($event)">
        </app-tree-view>
      </div>
    </div>
  `,
  styles: [`
    .tree-node { margin-left: 12px; }
    .node-content { 
      display: flex; 
      align-items: center; 
      gap: 8px; 
      padding: 6px 12px; 
      border-radius: 6px; 
      cursor: pointer; 
      transition: var(--transition);
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .node-content:hover { background: rgba(37, 99, 235, 0.05); }
    .node-content.selected { background: rgba(37, 99, 235, 0.1); color: var(--primary); font-weight: 600; }
    .type-icon { color: var(--text-muted); }
    .sub-nodes { border-left: 1px dashed var(--border); margin-left: 8px; }
  `]
})
export class TreeViewComponent {
  @Input() nodes: KnowledgeArea[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<KnowledgeArea>();

  expanded: { [key: string]: boolean } = {};

  toggle(event: Event, id: string) {
    event.stopPropagation();
    this.expanded[id] = !this.expanded[id];
  }

  onSelect(node: KnowledgeArea) {
    this.select.emit(node);
  }
}