import { Component } from '@angular/core';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, DashboardComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <main class="content">
        <app-dashboard></app-dashboard>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }
    .content {
      flex: 1;
      background: var(--bg-main);
    }
  `]
})
export class AppComponent {}