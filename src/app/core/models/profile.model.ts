export type UserRole = 'ADMIN' | 'PROFESSOR' | 'ALUNO' | 'GERENTE';

export interface Profile {
  id: string;
  codigo?: string;
  foto_perfil?: string;
  nome: string;
  cpf?: string;
  email: string;
  data_nascimento?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  estado?: string;
  cidade?: string;
  senha?: string;
  perfil: UserRole;
  ativo: boolean;
  created_at: string;
}