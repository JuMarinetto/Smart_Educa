export type CourseStatus = 'ATIVO' | 'INATIVO';

export interface Course {
  id: string;
  id_professor: string;
  titulo: string;
  status: CourseStatus;
  created_at: string;
}

export interface Topic {
  id: string;
  id_curso: string;
  id_topico_pai?: string;
  nome_topico: string;
  contents?: CourseContent[];
}

export interface CourseContent {
  id: string;
  id_topico: string;
  id_conteudo: string;
  ordem: number;
  versao_conteudo: number;
}