import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, SidebarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <main class="content">
        <router-outlet></router-outlet>
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