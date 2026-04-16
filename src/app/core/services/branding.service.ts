import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface BrandingConfig {
  id: string;
  primary_color: string;
  bg_color: string;
  card_color: string;
  text_color: string;
  border_radius: number;
  logo_url: string;
  school_name: string;
}

/** Valores padrão do sistema (SmartEduca original) */
export const DEFAULT_BRANDING: Omit<BrandingConfig, 'id'> = {
  primary_color: '#8b5cf6',
  bg_color: '#0f0a1e',
  card_color: '#1a1230',
  text_color: '#e8e4f0',
  border_radius: 12,
  logo_url: 'assets/logo.png',
  school_name: 'SmartEduca'
};

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private supabase = inject(SupabaseService).client;
  
  // Signal para acesso reativo em todo o sistema
  config = signal<BrandingConfig>({
    id: 'global',
    ...DEFAULT_BRANDING
  });

  /** Carrega as configurações do banco e aplica os estilos CSS */
  async loadBranding() {
    const { data, error } = await this.supabase
      .from('system_configurations')
      .select('*')
      .eq('id', 'global')
      .single();

    if (data && !error) {
      this.config.set(data as BrandingConfig);
      this.applyStyles(data as BrandingConfig);
    } else {
      this.applyStyles(this.config());
    }
  }

  /** Salva e aplica novas configurações */
  async saveBranding(newConfig: Partial<BrandingConfig>) {
    const { error } = await this.supabase
      .from('system_configurations')
      .update(newConfig)
      .eq('id', 'global');

    if (!error) {
      const updated = { ...this.config(), ...newConfig };
      this.config.set(updated);
      this.applyStyles(updated);
    }
    return { error };
  }

  /** Restaura as configurações padrão e aplica no banco/sistema */
  async resetBranding() {
    const { error } = await this.supabase
      .from('system_configurations')
      .update(DEFAULT_BRANDING)
      .eq('id', 'global');

    if (!error) {
      const reseted = { id: 'global', ...DEFAULT_BRANDING };
      this.config.set(reseted);
      this.applyStyles(reseted);
    }
    return { error };
  }

  /** Aplica variáveis CSS usando uma tag <style> para evitar sobrescrever o tema local via inline styles */
  private applyStyles(config: BrandingConfig) {
    const styleId = 'global-branding-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const primaryHover = this.shadeColor(config.primary_color, -20);
    const primaryRgb = this.hexToRgb(config.primary_color);

    styleElement.textContent = `
      :root {
        --primary: ${config.primary_color};
        --primary-hover: ${primaryHover};
        --primary-rgb: ${primaryRgb};
        --bg-main: ${config.bg_color};
        --bg-card: ${config.card_color};
        --bg-sidebar: ${config.card_color};
        --text-main: ${config.text_color};
        --radius: ${config.border_radius}px;
      }
      
      /* Ajuste automático para o polegar do scrollbar */
      ::-webkit-scrollbar-thumb {
        background: rgba(${primaryRgb}, 0.3);
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(${primaryRgb}, 0.5);
      }
    `;
  }

  /** Converte hex para string RGB (ex: "139, 92, 246") */
  private hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  /** Função auxiliar para escurecer/clarear cores hexadecimais */
  private shadeColor(color: string, percent: number) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
  }
}
