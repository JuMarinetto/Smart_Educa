export type ProgressStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export interface StudentProgress {
  id: string;
  id_aluno: string;
  id_conteudo: string;
  status: ProgressStatus;
  data_primeiro_acesso?: string;
  data_ultima_visualizacao?: string;
  porcentagem_concluida: number;
  data_conclusao?: string;
}

export interface CourseNavigation {
  currentContentId: string;
  nextContentId?: string;
  isLocked: boolean;
}