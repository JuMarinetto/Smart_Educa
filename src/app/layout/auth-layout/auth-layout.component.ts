import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [RouterModule],
    template: `
    <div class="auth-layout">
      <router-outlet></router-outlet>
    </div>
  `,
    styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-main);
    }
  `]
})
export class AuthLayoutComponent { }
