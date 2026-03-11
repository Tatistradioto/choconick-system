export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  cnpj: string | null;
  logo_url: string | null;
  pix_key: string | null;
  created_at: string;
}

export type IngredientCategory = 'frutas' | 'chocolate' | 'descartaveis' | 'outros';

export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  category: IngredientCategory;
  unit: string;
  purchase_price: number;
  grams_per_person: number | null;
  percentage_mix: number | null;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cpf: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
}

export type EventStatus = 'orcamento' | 'contrato_gerado' | 'realizado' | 'cancelado';

export interface Event {
  id: string;
  user_id: string;
  client_id: string | null;
  event_date: string | null;
  event_time: string | null;
  event_address: string | null;
  event_city: string | null;
  distance_km: number;
  guests_count: number;
  status: EventStatus;
  ingredients_cost: number | null;
  transport_cost: number | null;
  fixed_cost: number | null;
  total_cost: number | null;
  profit_margin: number;
  sale_price: number | null;
  price_per_person: number | null;
  payment_entry: number | null;
  payment_rest: number | null;
  payment_entry_date: string | null;
  payment_rest_date: string | null;
  entry_paid: boolean;
  rest_paid: boolean;
  notes: string | null;
  budget_number: string | null;
  contract_number: string | null;
  calculator_snapshot: import("@/lib/generateContractPdf").ContractCalculatorSnapshot | null;
  entry_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  event_id: string;
  ingredient_id: string | null;
  ingredient_name: string | null;
  quantity_kg: number | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface FixedCost {
  id: string;
  user_id: string;
  name: string;
  value: number;
  is_active: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  user_id: string;
  price_per_km: number;
  default_profit_margin: number;
  whatsapp_template: string | null;
  email_template: string | null;
  contract_clauses: string | null;
  contract_forum: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  event_id: string;
  pdf_url: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  description: string | null;
  amount: number | null;
  category: string | null;
  date: string | null;
  event_id: string | null;
  created_at: string;
}
