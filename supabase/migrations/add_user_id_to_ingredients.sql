-- Migração: adicionar coluna user_id à tabela ingredients
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor > New query)
-- Use se a tabela ingredients foi criada sem a coluna user_id

-- 1. Adicionar a coluna (permite NULL temporariamente)
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Preencher registros existentes com o primeiro usuário do projeto
UPDATE ingredients
SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

-- 3. Tornar a coluna obrigatória para novos registros (opcional)
-- ALTER TABLE ingredients ALTER COLUMN user_id SET NOT NULL;

-- 4. Atualizar política RLS para usar user_id (se já existir, recriar)
DROP POLICY IF EXISTS "Users manage own ingredients" ON ingredients;
CREATE POLICY "Users manage own ingredients" ON ingredients
  FOR ALL USING (auth.uid() = user_id);
