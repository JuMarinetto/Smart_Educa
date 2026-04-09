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

            <button class="btn-download" [disabled]="generating === cert.id" (click)="downloadCert(cert)">
              <lucide-icon *ngIf="generating !== cert.id" name="Download" size="18"></lucide-icon>
              <lucide-icon *ngIf="generating === cert.id" name="Loader" size="18" class="spin"></lucide-icon>
              {{ generating === cert.id ? 'Gerando PDF...' : 'Baixar PDF' }}
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
    .btn-download:hover:not(:disabled) { background: #8b5cf6; color: white; }
    .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }

    .spin { animation: spinAnim 1s linear infinite; display: inline-block; }
    @keyframes spinAnim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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
    generating: string | null = null;

    ngOnInit() {
        const studentId = this.authService.getLoggedProfile()?.id;
        if (studentId) {
            this.progressService.getStudentCertificates(studentId).subscribe(data => {
                this.certificates = data;
            });
        }
    }

    async downloadCert(cert: any) {
        this.generating = cert.id;
        try {
            const studentName = this.authService.getLoggedProfile()?.nome || 'Aluno';
            const courseName  = cert.courses?.titulo || 'Curso Concluído';
            const emissao     = new Date(cert.data_emissao).toLocaleDateString('pt-BR');
            const codigo      = cert.codigo_verificacao || '—';

            const canvas = document.createElement('canvas');
            // A4 landscape ~96dpi  →  1123 × 794
            canvas.width  = 1123;
            canvas.height = 794;
            const ctx = canvas.getContext('2d')!;

            // ── Background ──────────────────────────────────────────────────────
            ctx.fillStyle = '#0f0d1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // faixa superior gradient
            const topGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
            topGrad.addColorStop(0, '#8b5cf6');
            topGrad.addColorStop(1, '#6366f1');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, canvas.width, 14);

            // faixa inferior
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, canvas.height - 14, canvas.width, 14);

            // borda interna pontilhada
            ctx.strokeStyle = 'rgba(139,92,246,0.35)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            this._roundRect(ctx, 40, 40, canvas.width - 80, canvas.height - 80, 12);
            ctx.stroke();
            ctx.setLineDash([]);

            // ── Ornamentos de canto ──────────────────────────────────────────────
            const corners = [
                [60, 60], [canvas.width - 60, 60],
                [60, canvas.height - 60], [canvas.width - 60, canvas.height - 60]
            ];
            ctx.strokeStyle = 'rgba(139,92,246,0.5)';
            ctx.lineWidth = 2;
            for (const [cx, cy] of corners) {
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#8b5cf6';
                ctx.fill();
            }

            // ── Logo / medalha central superior ─────────────────────────────────
            const medalX = canvas.width / 2;
            const medalY = 130;
            const grad = ctx.createRadialGradient(medalX, medalY, 10, medalX, medalY, 55);
            grad.addColorStop(0, '#8b5cf6');
            grad.addColorStop(1, '#4f46e5');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(medalX, medalY, 55, 0, Math.PI * 2);
            ctx.fill();

            // estrela 8 pontas interna
            ctx.save();
            ctx.translate(medalX, medalY);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(0, -52);
                ctx.lineTo(5, -20);
                ctx.lineTo(0, 0);
                ctx.lineTo(-5, -20);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

            // ícone de troféu (texto unicode)
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏆', medalX, medalY + 2);

            // ── Título principal ─────────────────────────────────────────────────
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.letterSpacing = '6px';
            ctx.fillText('CERTIFICADO DE CONCLUSÃO', canvas.width / 2, 220);
            ctx.letterSpacing = '0px';

            // linha decorativa
            const lineGrad = ctx.createLinearGradient(canvas.width/2 - 180, 0, canvas.width/2 + 180, 0);
            lineGrad.addColorStop(0, 'transparent');
            lineGrad.addColorStop(0.5, '#8b5cf6');
            lineGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = lineGrad;
            ctx.fillRect(canvas.width/2 - 180, 238, 360, 2);

            // ── Texto "Certificamos que" ─────────────────────────────────────────
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '16px Arial, sans-serif';
            ctx.fillText('Certificamos que', canvas.width / 2, 275);

            // ── Nome do aluno ────────────────────────────────────────────────────
            ctx.fillStyle = '#c4b5fd';
            ctx.font = 'bold 42px Georgia, serif';
            ctx.fillText(studentName, canvas.width / 2, 335);

            // linha sob o nome
            const nameWidth = ctx.measureText(studentName).width;
            ctx.fillStyle = 'rgba(139,92,246,0.4)';
            ctx.fillRect(canvas.width/2 - nameWidth/2, 355, nameWidth, 1);

            // ── Texto "concluiu com êxito o curso" ──────────────────────────────
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '16px Arial, sans-serif';
            ctx.fillText('concluiu com êxito o curso', canvas.width / 2, 390);

            // ── Nome do curso ────────────────────────────────────────────────────
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillText(courseName, canvas.width / 2, 438);

            // ── Linha divisória ──────────────────────────────────────────────────
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(80, 480, canvas.width - 160, 1);

            // ── Rodapé: data, código, instituição ───────────────────────────────
            ctx.font = '13px Arial, sans-serif';
            ctx.textAlign = 'left';

            // Emitido em
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText('Data de emissão', 120, 520);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px Arial, sans-serif';
            ctx.fillText(emissao, 120, 542);

            // Código de verificação (centro)
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '13px Arial, sans-serif';
            ctx.fillText('Código de verificação', canvas.width / 2, 520);
            ctx.fillStyle = '#c4b5fd';
            ctx.font = 'bold 15px Arial, sans-serif';
            ctx.fillText(codigo, canvas.width / 2, 542);

            // Assinatura / Instituição
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '13px Arial, sans-serif';
            ctx.fillText('SmartEduca', canvas.width - 120, 520);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px Arial, sans-serif';
            ctx.fillText('Plataforma de Ensino', canvas.width - 120, 542);

            // linha assinatura
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(canvas.width - 260, 560);
            ctx.lineTo(canvas.width - 120, 560);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '11px Arial, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('Assinatura autorizada', canvas.width - 120, 575);

            // ── Abre janela de impressão para salvar como PDF ─────────────────
            const imgData = canvas.toDataURL('image/png', 1.0);
            const safeName = courseName.replace(/[^a-zA-Z0-9À-ÿ\s]/g, '').trim().replace(/\s+/g, '-');

            const win = window.open('', '_blank', 'width=1200,height=850');
            if (!win) {
                alert('Permita popups para baixar o certificado.');
                return;
            }

            win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificado - ${courseName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    img { max-width: 100%; height: auto; display: block; }
    .actions { position: fixed; top: 16px; right: 16px; display: flex; gap: 10px; z-index: 999; }
    .btn { padding: 10px 20px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; font-size: 14px; }
    .btn-save { background: #8b5cf6; color: #fff; }
    .btn-close { background: #e5e7eb; color: #111; }
    @media print {
      .actions { display: none !important; }
      body { margin: 0; }
      img { width: 100vw; height: 100vh; object-fit: contain; }
      @page { size: A4 landscape; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn btn-save" onclick="window.print()">⬇ Salvar como PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Fechar</button>
  </div>
  <img src="${imgData}" alt="Certificado - ${courseName}">
</body>
</html>`);
            win.document.close();
        } catch (err) {
            console.error('Erro ao gerar certificado:', err);
            alert('Erro ao gerar o certificado. Tente novamente.');
        } finally {
            this.generating = null;
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
