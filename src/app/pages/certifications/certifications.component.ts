import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="container">
      <header class="page-header">
        <h1>Certificações</h1>
        <p>Seu histórico de conquistas e certificados válidos.</p>
      </header>

      <div class="cert-list">
        <app-ui-card *ngFor="let cert of certs">
          <div class="cert-item">
            <div class="cert-icon"><lucide-icon [name]="'Award'" size="32"></lucide-icon></div>
            <div class="cert-details">
              <h3>{{cert.name}}</h3>
              <p>Emitido em: {{cert.date}} • Validade: {{cert.expiry}}</p>
            </div>
            <button class="btn-download">Download PDF</button>
          </div>
        </app-ui-card>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; margin-left: 280px; }
    .page-header { margin-bottom: 2rem; }
    .cert-list { display: flex; flex-direction: column; gap: 1rem; }
    .cert-item { display: flex; align-items: center; gap: 1.5rem; }
    .cert-icon { width: 60px; height: 60px; background: rgba(37, 99, 235, 0.1); color: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .cert-details { flex: 1; }
    .cert-details h3 { margin-bottom: 4px; }
    .cert-details p { font-size: 0.85rem; color: var(--text-muted); }
    .btn-download { padding: 0.6rem 1.2rem; background: var(--primary); color: white; border-radius: 8px; font-weight: 600; font-size: 0.9rem; }
  `]
})
export class CertificationsComponent {
  certs = [
    { name: 'Especialista em Cibersegurança', date: '12/01/2024', expiry: '12/01/2026' },
    { name: 'Compliance e LGPD', date: '05/11/2023', expiry: 'Permanente' }
  ];
}