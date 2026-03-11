-- Clients: add cpf_cnpj (address and city may already exist in schema)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;

-- Events: add mesa_tamanho for contract modal
ALTER TABLE events ADD COLUMN IF NOT EXISTS mesa_tamanho TEXT;
