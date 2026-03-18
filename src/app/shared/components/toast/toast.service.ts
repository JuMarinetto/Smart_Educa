import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();

    show(toast: Omit<Toast, 'id'>) {
        const id = Math.random().toString(36).substring(2, 9);
        const duration = toast.duration || 5000;
        const newToast: Toast = { ...toast, id, duration };

        this.toastsSubject.next([...this.toastsSubject.value, newToast]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, title?: string, duration?: number) {
        this.show({ type: 'success', message, title, duration });
    }

    error(message: string, title?: string, duration?: number) {
        this.show({ type: 'error', message, title, duration });
    }

    info(message: string, title?: string, duration?: number) {
        this.show({ type: 'info', message, title, duration });
    }

    warning(message: string, title?: string, duration?: number) {
        this.show({ type: 'warning', message, title, duration });
    }

    remove(id: string) {
        this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
    }
}
