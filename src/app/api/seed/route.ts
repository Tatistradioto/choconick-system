import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_INGREDIENTS = [
  { name: 'Morango', category: 'frutas', unit: 'kg', purchase_price: 45, grams_per_person: 420, percentage_mix: 42 },
  { name: 'Kiwi', category: 'frutas', unit: 'kg', purchase_price: 35, grams_per_person: 100, percentage_mix: 10 },
  { name: 'Uva', category: 'frutas', unit: 'kg', purchase_price: 20, grams_per_person: 180, percentage_mix: 18 },
  { name: 'Banana', category: 'frutas', unit: 'kg', purchase_price: 13, grams_per_person: 100, percentage_mix: 10 },
  { name: 'Abacaxi', category: 'frutas', unit: 'kg', purchase_price: 10, grams_per_person: 50, percentage_mix: 5 },
  { name: 'Mamão', category: 'frutas', unit: 'kg', purchase_price: 10, grams_per_person: 50, percentage_mix: 5 },
  { name: 'Manga', category: 'frutas', unit: 'kg', purchase_price: 10, grams_per_person: 50, percentage_mix: 5 },
  { name: 'Melão', category: 'frutas', unit: 'kg', purchase_price: 10, grams_per_person: 50, percentage_mix: 5 },
  { name: 'Chocolate Preto', category: 'chocolate', unit: 'kg', purchase_price: 100, grams_per_person: 60, percentage_mix: null },
  { name: 'Cumbuca c/10un', category: 'descartaveis', unit: 'pct', purchase_price: 0.8, grams_per_person: null, percentage_mix: null },
  { name: 'Colherzinha c/50un', category: 'descartaveis', unit: 'pct', purchase_price: 0.05, grams_per_person: null, percentage_mix: null },
  { name: 'Marchemelow', category: 'outros', unit: 'kg', purchase_price: 35, grams_per_person: null, percentage_mix: null },
  { name: 'Leite Condensado', category: 'outros', unit: 'un', purchase_price: 12, grams_per_person: null, percentage_mix: null },
  { name: 'Granulado', category: 'outros', unit: 'kg', purchase_price: 8, grams_per_person: null, percentage_mix: null },
  { name: 'Coco Ralado', category: 'outros', unit: 'kg', purchase_price: 5, grams_per_person: null, percentage_mix: null },
];

const DEFAULT_FIXED_COSTS = [
  { name: 'Internet/Despesas', value: 70 },
  { name: 'Combustível base', value: 70 },
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { data: existing } = await supabase.from('ingredients').select('id').limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Dados já existem' });
  }

  const ingredients = DEFAULT_INGREDIENTS.map((row) => ({
    user_id: user.id,
    ...row,
  }));
  const { error: errIng } = await supabase.from('ingredients').insert(ingredients);
  if (errIng) return NextResponse.json({ error: errIng.message }, { status: 500 });

  const fixedCosts = DEFAULT_FIXED_COSTS.map((row) => ({
    user_id: user.id,
    ...row,
  }));
  const { error: errFix } = await supabase.from('fixed_costs').insert(fixedCosts);
  if (errFix) return NextResponse.json({ error: errFix.message }, { status: 500 });

  return NextResponse.json({ message: 'Seed concluído' });
}
