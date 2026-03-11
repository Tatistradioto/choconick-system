-- ============================================================
-- ChocoNick - Validação e correção no Supabase (SQL Editor)
-- Execute no Supabase: SQL Editor > New query > Cole e Run
--
-- Se as tabelas (events, event_items, clients, contracts) ainda
-- não existirem, rode antes o arquivo supabase/schema.sql.
-- ============================================================

-- 1) Garantir que as funções existem e retornam TEXT (evita erro no app)
CREATE OR REPLACE FUNCTION next_budget_number()
RETURNS TEXT AS $$
  SELECT 'ORC-' || to_char(NOW(), 'YYYY') || '-' || lpad((COUNT(*) + 1)::text, 3, '0')
  FROM events
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION next_contract_number()
RETURNS TEXT AS $$
  SELECT 'CTR-' || to_char(NOW(), 'YYYY') || '-' || lpad((COUNT(*) + 1)::text, 3, '0')
  FROM contracts c
  JOIN events e ON e.id = c.event_id
  WHERE EXTRACT(YEAR FROM c.created_at) = EXTRACT(YEAR FROM NOW())
    AND e.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2) Permissão para o role authenticated executar as funções
GRANT EXECUTE ON FUNCTION next_budget_number() TO authenticated;
GRANT EXECUTE ON FUNCTION next_contract_number() TO authenticated;
GRANT EXECUTE ON FUNCTION next_budget_number() TO service_role;
GRANT EXECUTE ON FUNCTION next_contract_number() TO service_role;

-- 3) RLS em events: garantir política que permite INSERT/UPDATE/SELECT/DELETE
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own events" ON events;
CREATE POLICY "Users manage own events" ON events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) RLS em event_items: garantir que INSERT está permitido para o dono do evento
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage event_items via events" ON event_items;
CREATE POLICY "Users manage event_items via events" ON event_items
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- 5) RLS em clients (necessário para criar cliente ao salvar orçamento)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own clients" ON clients;
CREATE POLICY "Users manage own clients" ON clients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6) Garantir que contracts permite INSERT quando o evento é do usuário
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage contracts via events" ON contracts;
CREATE POLICY "Users manage contracts via events" ON contracts
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- 7) Coluna status_flow (fluxo: orcamento → contrato_gerado → realizado)
ALTER TABLE events ADD COLUMN IF NOT EXISTS status_flow TEXT DEFAULT 'orcamento';

-- 8) Snapshot da calculadora para restaurar orçamento ao editar
ALTER TABLE events ADD COLUMN IF NOT EXISTS calculator_snapshot JSONB;

-- 9) Template de contrato personalizável por usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_template TEXT;

-- 10) Verificação rápida (opcional): listar tabelas e políticas
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
