-- Seed: executar APÓS criar um usuário (substitua USER_UUID pelo id do auth.users)
-- Ou use a API/interface para inserir ingredientes após primeiro login

-- Exemplo de inserção de ingredientes (requer user_id do usuário logado):
-- INSERT INTO ingredients (user_id, name, category, unit, purchase_price, grams_per_person, percentage_mix) VALUES
-- ('USER_UUID', 'Morango', 'frutas', 'kg', 45.00, 420, 42),
-- ('USER_UUID', 'Kiwi', 'frutas', 'kg', 35.00, 100, 10),
-- ...

-- Custos fixos padrão (também requer user_id):
-- INSERT INTO fixed_costs (user_id, name, value) VALUES
-- ('USER_UUID', 'Internet/Despesas', 70.00),
-- ('USER_UUID', 'Combustível base', 70.00);

-- Nota: O seed real é feito via API no primeiro acesso (src/app/api/seed/route.ts)
-- para usar o user_id do usuário autenticado.
