import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ProgressService } from '../../../core/services/progress.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-student-certificates',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    template: `
    <div class="certificates-page">
      <header class="page-header">
        <div>
          <h1>Meus Certificados</h1>
          <p>Visualize e baixe os certificados dos cursos que você concluiu com sucesso.</p>
        </div>
      </header>

      <div class="cert-grid" *ngIf="certificates.length > 0">
        <div class="cert-card" *ngFor="let cert of certificates">
          <div class="cert-header">
            <div class="cert-icon">
              <lucide-icon name="Award" size="32"></lucide-icon>
            </div>
          </div>
          <div class="cert-body">
            <h3>{{ cert.courses?.titulo || 'Curso Concluído' }}</h3>
            <div class="cert-meta">
              <span><strong>Emitido em:</strong> {{ cert.data_emissao | date:'dd/MM/yyyy' }}</span>
              <span *ngIf="cert.data_validade"><strong>Válido até:</strong> {{ cert.data_validade | date:'dd/MM/yyyy' }}</span>
              <span><strong>Código:</strong> {{ cert.codigo_verificacao }}</span>
            </div>
            
            <button class="btn-download" (click)="downloadCert(cert)">
              <lucide-icon name="Download" size="18"></lucide-icon>
              Baixar PDF
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="certificates.length === 0">
        <div class="empty-icon">
          <lucide-icon name="Award" size="48"></lucide-icon>
        </div>
        <h3>Nenhum certificado ainda</h3>
        <p>Complete as aulas e seja aprovado nas avaliações para conquistar seus certificados!</p>
        <a class="btn-accent" routerLink="/student/my-courses">
          <lucide-icon name="Play" size="16"></lucide-icon>
          Ir para Meus Cursos
        </a>
      </div>
    </div>
  `,
    styles: [`
    :host {
      --st-bg-card: var(--bg-card);
      --st-border: var(--border);
      --st-text: var(--text-main);
      --st-text-muted: var(--text-muted);
      --st-accent: var(--primary);
      --st-radius: 12px;
    }

    .certificates-page { max-width: 1000px; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.6rem; font-weight: 800; }
    .page-header p { color: var(--st-text-muted); font-size: 0.95rem; margin-top: 0.25rem; }

    .cert-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .cert-card { display: flex; flex-direction: column; background: var(--st-bg-card); border: 1px solid var(--st-border); border-radius: var(--st-radius); overflow: hidden; transition: all 0.25s; }
    .cert-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-color: rgba(139,92,246,0.3); }
    
    .cert-header { background: linear-gradient(135deg, #8b5cf6, #6366f1); height: 80px; position: relative; display: flex; align-items: flex-end; justify-content: center; }
    .cert-icon { width: 64px; height: 64px; background: var(--st-bg-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8b5cf6; position: absolute; bottom: -32px; border: 4px solid var(--st-bg-card); }
    
    .cert-body { padding: 2.5rem 1.5rem 1.5rem; text-align: center; flex: 1; display: flex; flex-direction: column; }
    .cert-body h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--st-text); line-height: 1.4; }
    .cert-meta { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; color: var(--st-text-muted); text-align: left; background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--st-border); }
    .cert-meta span { display: flex; justify-content: space-between; gap: 10px; }
    
    .btn-download { margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 0.8rem; background: rgba(139,92,246,0.1); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.2); border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-download:hover { background: #8b5cf6; color: white; }

    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--st-text-muted); }
    .empty-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(139,92,246,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: #8b5cf6; }
    .empty-state h3 { font-size: 1.2rem; color: var(--st-text); margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.95rem; margin-bottom: 1.5rem; }
    .btn-accent { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: transform 0.2s; }
    .btn-accent:hover { transform: translateY(-2px); }
  `]
})
export class StudentCertificatesComponent implements OnInit {
    private progressService = inject(ProgressService);
    private authService = inject(AuthService);

    certificates: any[] = [];

    ngOnInit() {
        const studentId = this.authService.getLoggedProfile()?.id;
        if (studentId) {
            this.progressService.getStudentCertificates(studentId).subscribe(data => {
                this.certificates = data;
            });
        }
    }

    downloadCert(cert: any) {
        if (cert.url_pdf) {
            window.open(cert.url_pdf, '_blank');
        } else {
            alert('Funcionalidade de geração de PDF em desenvolvimento.');
        }
    }
}
