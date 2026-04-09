export interface Content {
  id: string;
  id_area_conhecimento: string;
  titulo_tema: string;
  descricao: string;
  conteudo_html?: string;
  documento_url?: string;
  versao: number;
  is_latest: boolean;
  created_at: string;
}