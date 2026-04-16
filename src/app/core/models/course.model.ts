export type CourseStatus = 'Ativo' | 'Inativo';

export interface CourseAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface Course {
  id: string;
  id_professor: string | null;
  titulo: string;
  status: CourseStatus;
  created_at: string;
  anexos?: CourseAttachment[];
}

export interface Topic {
  id: string;
  id_curso: string;
  id_topico_pai?: string;
  nome_topico: string;
  contents?: CourseContent[];
}

export type CourseItemType = 'conteudo' | 'questao';

export interface CourseContent {
  id: string;
  id_topico: string;
  id_conteudo?: string;
  id_questao?: string;
  tipo: CourseItemType;
  ordem: number;
  versao_conteudo?: number;
}