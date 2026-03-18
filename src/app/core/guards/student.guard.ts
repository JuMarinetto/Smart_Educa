import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const studentGuard: CanActivateFn = () => {
    const authService = inject(AuthService);

    if (authService.getRole() === 'student') {
        return true;
    }

    // If not a student, force logout and ask to re-login
    authService.logout();
    return false;
};
