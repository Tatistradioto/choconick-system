/** Dados iniciais da calculadora (espelho do FullCalculator) */

export type FruitItem = { id: string; name: string; pct: number; pricePerKg: number; active: boolean };
export type ChocolateItem = { id: string; name: string; gramsPerPerson: number; pricePerKg: number; minFixedKg: number; active: boolean };
export type GenericItem = { id: string; name: string; qty: number; price: number; unit: string; active: boolean; qtdPorPessoa?: number };
export type OptionalItem = { id: string; name: string; qty: number; price: number; unit: string; active: boolean; desc?: string };

/** FRUTAS (200g/pessoa no total; percentuais por tipo) */
export const initialFrutas: FruitItem[] = [
  { id: "morango", name: "Morango", pct: 42, pricePerKg: 45, active: true },
  { id: "uva", name: "Uva", pct: 18, pricePerKg: 24, active: true },
  { id: "kiwi", name: "Kiwi", pct: 10, pricePerKg: 35, active: true },
  { id: "banana", name: "Banana", pct: 10, pricePerKg: 10, active: true },
  { id: "abacaxi", name: "Abacaxi", pct: 5, pricePerKg: 15, active: true },
  { id: "mamao", name: "Mamão", pct: 5, pricePerKg: 8, active: true },
  { id: "manga", name: "Manga", pct: 5, pricePerKg: 8, active: true },
  { id: "melao", name: "Melão", pct: 5, pricePerKg: 6, active: true },
];

/** CHOCOLATE */
export const initialChocolate: ChocolateItem[] = [
  { id: "choc_preto", name: "Chocolate Preto", gramsPerPerson: 60, pricePerKg: 100, minFixedKg: 6, active: true },
];

/** DESCARTÁVEIS */
export const initialDescartaveis: GenericItem[] = [
  { id: "cumbuca", name: "Cumbuca", qty: 0, price: 0.4, unit: "un", active: true, qtdPorPessoa: 2.5 },
  { id: "colher", name: "Colherzinha", qty: 0, price: 0.05, unit: "un", active: true, qtdPorPessoa: 2.5 },
  { id: "palito", name: "Palito de Churrasco", qty: 1, price: 4, unit: "un", active: true },
  { id: "papel", name: "Papel Toalha", qty: 2, price: 8, unit: "un", active: true },
  { id: "guardanapo", name: "Guardanapo", qty: 1, price: 4, unit: "un", active: true },
  { id: "saco", name: "Saco de Plástico", qty: 1, price: 5, unit: "un", active: true },
  { id: "plastico", name: "Plástico Filme", qty: 1, price: 15, unit: "un", active: true },
];

/** OUTROS ITENS */
export const initialOutros: GenericItem[] = [
  { id: "marchemelow", name: "Marchemelow", qty: 2, price: 8, unit: "kg", active: true },
  { id: "leite", name: "Leite Condensado", qty: 2, price: 6, unit: "un", active: true },
  { id: "granulado", name: "Granulado", qty: 1, price: 8, unit: "kg", active: true },
  { id: "coco", name: "Coco Ralado", qty: 1, price: 5, unit: "kg", active: true },
  { id: "oleo", name: "Óleo de Canola", qty: 1, price: 14, unit: "L", active: true },
  { id: "cascao_sorvete", name: "Cascão de Sorvete", qty: 1, price: 11, unit: "un", active: true },
];

/** DESPESAS OPERACIONAIS */
export const initialDespesas: GenericItem[] = [
  { id: "combustivel", name: "Combustível p/ comprar mercadoria", qty: 70, price: 1, unit: "fixo", active: true },
  { id: "combustivel_evento", name: "Combustível p/ evento", qty: 30, price: 2.5, unit: "km", active: true },
  { id: "internet", name: "Internet/Despesas digitais", qty: 70, price: 1, unit: "fixo", active: true },
  { id: "mao_obra_atendentes", name: "Mão de Obra Atendentes", qty: 2, price: 110, unit: "pessoa", active: true },
  { id: "picagem", name: "Serviço de Picagem de Frutas", qty: 1, price: 150, unit: "serviço", active: true },
  { id: "locacao_carretinha", name: "Locação da Carretinha", qty: 1, price: 120, unit: "diária", active: true },
  { id: "hospedagem", name: "Hospedagem fora de Goiânia", qty: 1, price: 200, unit: "diária", active: false },
];

/** OPCIONAIS */
export const initialOpcionais: OptionalItem[] = [
  { id: "mini_cascata", name: "Mini Cascata", qty: 1, price: 250, unit: "un", active: false, desc: "Mini cascata com 1kg de chocolate branco" },
  { id: "hora_add", name: "Hora Adicional", qty: 1, price: 50, unit: "hora", active: false, desc: "Hora extra além do contratado" },
];
