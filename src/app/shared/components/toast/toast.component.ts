import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import { LucideAngularModule } from 'lucide-angular';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" 
           class="toast" 
           [ngClass]="'toast-' + toast.type"
           @toastAnimation>
        
        <div class="toast-icon">
          <lucide-icon *ngIf="toast.type === 'success'" name="CheckCircle" size="24"></lucide-icon>
          <lucide-icon *ngIf="toast.type === 'error'" name="AlertCircle" size="24"></lucide-icon>
          <lucide-icon *ngIf="toast.type === 'info'" name="Info" size="24"></lucide-icon>
          <lucide-icon *ngIf="toast.type === 'warning'" name="AlertTriangle" size="24"></lucide-icon>
        </div>
        
        <div class="toast-content">
          <h4 *ngIf="toast.title" class="toast-title">{{ toast.title }}</h4>
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        
        <button class="toast-close" (click)="removeToast(toast.id)">
          <lucide-icon name="X" size="18"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      padding: 16px;
      background: var(--bg-card);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      border-left: 4px solid transparent;
      overflow: hidden;
      position: relative;
    }

    .toast-success { border-left-color: var(--success); }
    .toast-success .toast-icon { color: var(--success); }
    
    .toast-error { border-left-color: var(--danger); }
    .toast-error .toast-icon { color: var(--danger); }
    
    .toast-warning { border-left-color: var(--warning); }
    .toast-warning .toast-icon { color: var(--warning); }
    
    .toast-info { border-left-color: var(--primary); }
    .toast-info .toast-icon { color: var(--primary); }

    .toast-icon {
      margin-right: 12px;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
      margin-right: 12px;
    }

    .toast-title {
      margin: 0 0 4px 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .toast-message {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .toast-close:hover {
      opacity: 1;
    }
  `],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class ToastComponent {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  removeToast(id: string) {
    this.toastService.remove(id);
  }
}
