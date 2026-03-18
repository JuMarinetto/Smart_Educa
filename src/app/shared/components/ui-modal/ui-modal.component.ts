import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
    selector: 'app-ui-modal',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="closeOnOverlay($event)">
      <div class="modal-content" [style.width]="width">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" (click)="close()">
            <lucide-icon name="X" size="20"></lucide-icon>
          </button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-content {
      background: var(--bg-card);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: var(--danger);
    }
  `]
})
export class UiModalComponent {
    @Input() isOpen = false;
    @Input() title = '';
    @Input() width = '500px';
    @Output() isOpenChange = new EventEmitter<boolean>();

    close() {
        this.isOpen = false;
        this.isOpenChange.emit(false);
    }

    closeOnOverlay(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
            this.close();
        }
    }
}
