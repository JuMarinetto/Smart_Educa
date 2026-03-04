export type AssessmentType = 'DIAGNOSTICA' | 'FORMATIVA' | 'SOMATIVA';
export type AssessmentStatus = 'RASCUNHO' | 'PUBLICADA' | 'ENCERRADA';

export interface Assessment {
  id: string;
  nome: string;
  tipo: AssessmentType;
  status: AssessmentStatus;
  nota_total: number;
  nota_corte: number;
  regras_nota_minima_area?: Record<string, number>; // ID Área -> Nota Mínima
}

export interface AssessmentSnapshot {
  id: string;
  id_avaliacao_aluno: string;
  id_questao_original: string;
  enunciado: string;
  area_conhecimento: string;
  alternativas: {
    texto: string;
    is_correta: boolean;
    selecionada_pelo_aluno: boolean;
  }[];
}

export interface StudentAssessment {
  id: string;
  id_avaliacao: string;
  id_aluno: string;
  nota_final: number;
  aprovado: boolean;
  data_inicio: string;
  data_fim?: string;
  tempo_gasto_segundos?: number;
  reprovas_por_area?: string[]; // IDs das áreas onde não atingiu a nota de corte
}