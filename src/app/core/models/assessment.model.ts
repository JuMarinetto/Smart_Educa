export type AssessmentType = 'DIAGNOSTICA' | 'FORMATIVA' | 'SOMATIVA';
export type AssessmentStatus = 'RASCUNHO' | 'PUBLICADA' | 'ENCERRADA';

export interface Assessment {
  id: string;
  nome: string;
  tipo: AssessmentType;
  status: AssessmentStatus;
  modo_criacao?: string;
  data_inicio?: string;
  data_fim?: string;
  duracao?: number;
  cronometro: boolean;
  nota_total: number;
  regras_nota_minima_area?: any;
}

export interface StudentAssessment {
  id: string;
  id_avaliacao: string;
  id_aluno: string;
  nota_final?: number;
  status_aprovacao?: boolean;
  data_realizacao: string;
}