export type AssessmentType = 'DIAGNOSTICA' | 'FORMATIVA' | 'SOMATIVA';
export type AssessmentStatus = 'RASCUNHO' | 'PUBLICADA' | 'ENCERRADA';

export interface Assessment {
  id: string;
  nome: string;
  tipo: AssessmentType;
  status: AssessmentStatus;
  nota_total: number;
  nota_corte: number;
  duracao?: number | null;
  modo_criacao?: string;
  cronometro?: boolean;
  regras_nota_minima_area?: Record<string, number>; // ID Área -> Nota Mínima
}

export interface AssessmentSnapshot {
  id: string;
  id_avaliacao_original: string;
  id_aluno: string;
  data_aplicacao: string;
  numero_tentativa: number;
  json_questoes: any[]; // Cópia completa das questões com código, enunciado, alternativas, área e pontuação
  json_respostas_aluno?: any[]; // Respostas do aluno
  nota_obtida?: number;
  tempo_gasto_segundos?: number;
  status_aprovacao?: boolean;
  areas_reprovadas?: string[]; // IDs das áreas reprovadas
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