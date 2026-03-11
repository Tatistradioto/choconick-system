-- ChocoNick - Schema completo do banco (Supabase/PostgreSQL)
-- Execute no SQL Editor do Supabase

-- Usuários/empresa (vinculado ao auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  cnpj TEXT,
  logo_url TEXT,
  pix_key TEXT,
  contract_template TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: usuário só acessa seu próprio profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Ingredientes / matéria-prima
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  grams_per_person DECIMAL(10,2),
  percentage_mix DECIMAL(5,2),
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ingredients" ON ingredients FOR ALL USING (auth.uid() = user_id);

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- Eventos / Orçamentos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_date DATE,
  event_time TIME,
  event_address TEXT,
  event_city TEXT,
  distance_km DECIMAL(8,2) DEFAULT 0,
  guests_count INTEGER NOT NULL,
  status TEXT DEFAULT 'orcamento',
  ingredients_cost DECIMAL(10,2),
  transport_cost DECIMAL(10,2),
  fixed_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  profit_margin DECIMAL(5,2) DEFAULT 35,
  sale_price DECIMAL(10,2),
  price_per_person DECIMAL(10,2),
  payment_entry DECIMAL(10,2),
  payment_rest DECIMAL(10,2),
  payment_entry_date DATE,
  payment_rest_date DATE,
  entry_paid BOOLEAN DEFAULT FALSE,
  rest_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  budget_number TEXT,
  contract_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON events FOR ALL USING (auth.uid() = user_id);

-- Itens do evento (ingredientes usados no orçamento - snapshot de preços)
CREATE TABLE IF NOT EXISTS event_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_name TEXT,
  quantity_kg DECIMAL(10,3),
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2)
);

ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage event_items via events" ON event_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- Custos fixos configuráveis
CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own fixed_costs" ON fixed_costs FOR ALL USING (auth.uid() = user_id);

-- Configurações da empresa (km, margem padrão, etc.)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  price_per_km DECIMAL(10,2) DEFAULT 2.50,
  default_profit_margin DECIMAL(5,2) DEFAULT 35,
  whatsapp_template TEXT,
  email_template TEXT,
  contract_clauses TEXT,
  contract_forum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON settings FOR ALL USING (auth.uid() = user_id);

-- Contratos gerados
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage contracts via events" ON contracts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.user_id = auth.uid())
  );

-- Despesas avulsas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  amount DECIMAL(10,2),
  category TEXT,
  date DATE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

-- Sequências para número de orçamento e contrato por ano
CREATE OR REPLACE FUNCTION next_budget_number()
RETURNS TEXT AS $$
  SELECT 'ORC-' || to_char(NOW(), 'YYYY') || '-' || lpad((COUNT(*) + 1)::text, 3, '0')
  FROM events WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION next_contract_number()
RETURNS TEXT AS $$
  SELECT 'CTR-' || to_char(NOW(), 'YYYY') || '-' || lpad((COUNT(*) + 1)::text, 3, '0')
  FROM contracts c
  JOIN events e ON e.id = c.event_id
  WHERE EXTRACT(YEAR FROM c.created_at) = EXTRACT(YEAR FROM NOW()) AND e.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger: criar profile ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, owner_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'company_name'
  );
  INSERT INTO public.settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
