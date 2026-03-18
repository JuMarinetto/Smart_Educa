import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterModule, SidebarComponent],
    template: `
    <div class="admin-layout">
      <app-sidebar></app-sidebar>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
    }
    .content {
      flex: 1;
      background: var(--bg-main);
    }
  `]
})
export class AdminLayoutComponent { }
