export interface KnowledgeArea {
  id: string;
  id_area_conhecimento_pai?: string | null;
  parent_id?: string | null; // Alias for form usage
  area_conhecimento: string;
  permite_conteudo: boolean;
  path?: string;
  created_at: string;
  sub_areas?: KnowledgeArea[];
}