export interface Alternative {
  id: string;
  id_questao: string;
  texto: string;
  is_correta: boolean;
}

export interface Question {
  id: string;
  codigo?: string;
  titulo?: string;
  enunciado: string;
  id_conteudo: string;
  alternatives?: Alternative[];
}