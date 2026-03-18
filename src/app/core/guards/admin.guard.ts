import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);

    if (authService.getRole() === 'admin') {
        return true;
    }

    // If not admin, force a fresh login
    authService.logout();
    return false;
};
