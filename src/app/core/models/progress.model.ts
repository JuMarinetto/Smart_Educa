export type ProgressStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export interface StudentProgress {
  id: string;
  id_aluno: string;
  id_conteudo: string;
  status: ProgressStatus;
  porcentagem_concluida: number;
  tempo_total_segundos: number;
  ultima_interacao: string;
}