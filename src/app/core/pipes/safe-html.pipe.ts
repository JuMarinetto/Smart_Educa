import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'safeHtml',
    standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
    private sanitizer = inject(DomSanitizer);

    transform(value: any): SafeHtml {
        if (!value) return '';
        // ✅ SEGURANÇA: Sanitiza o HTML antes de marcar como confiável,
        // removendo scripts e atributos perigosos (onerror, onload, etc.)
        const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';
        return this.sanitizer.bypassSecurityTrustHtml(sanitized);
    }
}
