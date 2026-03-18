-- Correção: Restaurar acesso ao Login
-- O problema ocorreu porque a tabela 'profiles' foi restringida apenas a usuários logados, 
-- mas o sistema precisa ler os dados antes do login ser completado para verificar a senha.

-- 1. Remover a política restritiva anterior
DROP POLICY IF EXISTS "Fully authenticated reading of profiles" ON public.profiles;

-- 2. Criar uma nova política que permite leitura pública (necessário para o seu sistema de login customizado)
CREATE POLICY "Public reading of profiles for login" ON public.profiles
    FOR SELECT TO public USING (true);
