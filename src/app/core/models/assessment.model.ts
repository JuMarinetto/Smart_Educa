export type AssessmentType = 'DIAGNOSTICA' | 'FORMATIVA' | 'SOMATIVA';

export type AssessmentStatus = 'RASCUNHO' | 'PUBLICADA' | 'ENCERRADA';

export interface Assessment {
  id: string;
  nome: string;
  tipo: AssessmentType;
  status: AssessmentStatus;
  /** Pontuação máxima possível na avaliação. */
  nota_total: number;
  /** Nota mínima necessária para aprovação (geral). */
  nota_corte: number;
  /** Tempo máximo em minutos (opcional). */
  duracao?: number | null;
  /** 'IA' ou 'MANUAL'. */
  modo_criacao?: string;
  /** Se deve exibir cronômetro para o aluno. */
  cronometro?: boolean;
  /** Mapeamento de notas de corte por Área de Conhecimento (ID -> Nota). */
  regras_nota_minima_area?: Record<string, number>;
  /** Mapeamento de notas de corte por Conteúdo específico (ID -> Nota). */
  regras_nota_minima_conteudo?: Record<string, number>;
  /** Vínculo opcional com um curso. */
  id_curso?: string | null;
  /** Área de conhecimento para geração via IA. */
  id_area_conhecimento?: string | null;
  /** Quantidade de questões para geração via IA. */
  qtd_questoes?: number | null;
}

/** 
 * Registro imutável de uma tentativa de avaliação realizada pelo aluno. 
 * Contém uma cópia fiel das questões no momento da aplicação.
 */
export interface AssessmentSnapshot {
  id: string;
  id_avaliacao_original: string;
  id_aluno: string;
  data_aplicacao: string;
  /** Contador de tentativas deste aluno para esta avaliação. */
  numero_tentativa: number;
  /** Cópia completa das questões com código, enunciado, alternativas, área e pontuação. */
  json_questoes: any[];
  /** Respostas enviadas pelo aluno. */
  json_respostas_aluno?: any[];
  /** Resultado final calculado. */
  nota_obtida?: number;
  tempo_gasto_segundos?: number;
  status_aprovacao?: boolean;
  /** IDs das áreas onde o aluno não atingiu o rendimento mínimo. */
  areas_reprovadas?: string[];
}

/** Modelo simplificado de participação do aluno em uma avaliação. */
export interface StudentAssessment {
  id: string;
  id_avaliacao: string;
  id_aluno: string;
  nota_final: number;
  aprovado: boolean;
  data_inicio: string;
  data_fim?: string;
  tempo_gasto_segundos?: number;
  /** IDs das áreas onde não atingiu a nota de corte. */
  reprovas_por_area?: string[];
}
