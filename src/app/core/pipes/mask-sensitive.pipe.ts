import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Pipe({
    name: 'maskSensitive',
    standalone: true
})
export class MaskSensitivePipe implements PipeTransform {
    authService = inject(AuthService);

    transform(value: string | any, columnKey: string): string | any {
        if (!value || typeof value !== 'string') return value;

        // Check if current user is admin (simplified check for demo purposes, 
        // real app would subscribe to user role or check a decoded JWT)
        // If admin, return unmasked value.
        const isAdmin = false; // Mocking false to demonstrate the masking

        // If we have an admin, don't mask.
        if (isAdmin) return value;

        // Masking rules based on column keys or content
        if (columnKey.toLowerCase().includes('cpf') || /\d{3}\.\d{3}\.\d{3}-\d{2}/.test(value)) {
            // e.g. 111.222.333-44 -> ***.***.333-**
            return value.replace(/\d{3}\.\d{3}/, '***.***').replace(/-\d{2}/, '-**');
        }

        if (columnKey.toLowerCase().includes('email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            // e.g. user@email.com -> u***@email.com
            const parts = value.split('@');
            if (parts.length === 2) {
                const name = parts[0];
                const maskedName = name.length > 2 ? name.substring(0, 1) + '***' : '*';
                return `${maskedName}@${parts[1]}`;
            }
        }

        return value;
    }
}
