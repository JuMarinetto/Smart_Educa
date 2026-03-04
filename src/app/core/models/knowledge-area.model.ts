export interface KnowledgeArea {
  id: string;
  id_area_conhecimento_pai?: string;
  area_conhecimento: string;
  permite_conteudo: boolean;
  created_at: string;
  sub_areas?: KnowledgeArea[];
}