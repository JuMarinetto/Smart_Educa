export interface StudentProgress {
  id: string;
  id_aluno: string;
  id_conteudo: string;
  visualizado: boolean;
  data_primeiro_acesso: string;
  data_ultima_visualizacao: string;
  tempo_total_segundos: number;
  porcentagem_concluida: number;
  data_conclusao?: string;
}

export interface CourseNavigation {
  currentContentId: string;
  nextContentId?: string;
  isLocked: boolean;
}