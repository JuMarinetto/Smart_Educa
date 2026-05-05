import { Injectable } from '@angular/core';

export type VideoProvider = 'youtube' | 'vimeo' | 'unknown';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  /** Detecta o provedor a partir da URL */
  detectProvider(url: string): VideoProvider {
    if (!url) return 'unknown';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'unknown';
  }

  /** 
   * Analisa a URL do Vimeo para extrair ID e Hash de segurança
   * Suporta:
   * - vimeo.com/123456789
   * - vimeo.com/123456789/abcdef1234 (unlisted)
   * - player.vimeo.com/video/123456789
   */
  parseVimeoUrl(url: string): { id: string, hash?: string } | null {
    if (!url) return null;
    
    // Regex para capturar ID e opcionalmente o Hash (segmento após o ID)
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i;
    const match = url.match(vimeoRegex);
    
    if (!match) return null;

    return {
      id: match[1],
      hash: match[2]
    };
  }

  /** Extrai o ID do vídeo do YouTube */
  private extractYoutubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  /** Retorna a URL de embed pronta para uso em iframe */
  getEmbedUrl(url: string): string {
    if (!url) return '';
    
    const provider = this.detectProvider(url);

    if (provider === 'youtube') {
      const id = this.extractYoutubeId(url);
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : '';
    }

    if (provider === 'vimeo') {
      const videoData = this.parseVimeoUrl(url);
      if (!videoData) return '';
      
      let embed = `https://player.vimeo.com/video/${videoData.id}`;
      // Importante: O parâmetro 'h' é obrigatório para vídeos configurados como "Ocultar do Vimeo"
      if (videoData.hash) {
        embed += `?h=${videoData.hash}&autoplay=1`;
      } else {
        embed += `?autoplay=1`;
      }
      return embed;
    }

    return '';
  }
}
