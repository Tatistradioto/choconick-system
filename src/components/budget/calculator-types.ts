export type LineItem = {
  id: string;
  label: string;
  enabled: boolean;
  quantity: number;
  unitPrice: number;
  unit?: string;
  /** Se definido, quantidade é calculada a partir de convidados (ex: ceil(guests/10)) */
  quantityFromGuests?: (guests: number) => number;
};

export type FruitLine = {
  id: string;
  name: string;
  percentageMix: number;
  unitPrice: number;
  /** kg calculado a partir de totalG e % */
  calculatedKg: number;
  total: number;
};

export type OptionalItem = {
  id: string;
  label: string;
  enabled: boolean;
  unitPrice: number;
  quantity: number;
  unit?: string;
};

export type OperationalExpense = {
  id: string;
  label: string;
  enabled: boolean;
  /** 'fixed' | 'per_km' | 'per_unit' (e.g. per attendant) */
  type: "fixed" | "per_km" | "per_unit";
  value: number;
  quantity?: number;
  /** para per_unit: qty × value */
};

export const DEFAULT_DESCARTAVEIS: Omit<LineItem, "quantity" | "quantityFromGuests">[] = [
  { id: "cumbuca", label: "Cumbuca c/10un", enabled: true, unitPrice: 0.8, unit: "pct" },
  { id: "colherzinha", label: "Colherzinha c/50un", enabled: true, unitPrice: 0.05, unit: "pct" },
  { id: "palito", label: "Palito de Churrasco", enabled: true, unitPrice: 0, unit: "un" },
  { id: "papel", label: "Papel Toalha", enabled: true, unitPrice: 0, unit: "un" },
  { id: "guardanapo", label: "Guardanapo", enabled: true, unitPrice: 0, unit: "un" },
  { id: "saco", label: "Saco de Plástico", enabled: true, unitPrice: 0, unit: "un" },
  { id: "filme", label: "Plástico Filme", enabled: true, unitPrice: 0, unit: "un" },
];

export const DEFAULT_OUTROS: Omit<LineItem, "quantity" | "quantityFromGuests">[] = [
  { id: "marchemelow", label: "Marchemelow", enabled: true, unitPrice: 35, unit: "kg" },
  { id: "leite", label: "Leite Condensado", enabled: true, unitPrice: 12, unit: "un" },
  { id: "granulado", label: "Granulado", enabled: true, unitPrice: 8, unit: "kg" },
  { id: "coco", label: "Coco Ralado", enabled: true, unitPrice: 5, unit: "kg" },
  { id: "oleo", label: "Óleo de Canola", enabled: true, unitPrice: 0, unit: "L" },
  { id: "cascao", label: "Cascão de Sorvete", enabled: true, unitPrice: 0, unit: "un" },
];

export const DEFAULT_OPCIONAIS: OptionalItem[] = [
  { id: "mini-cascata", label: "Mini Cascata", enabled: false, unitPrice: 250, quantity: 1, unit: "un" },
  { id: "hora-extra", label: "Hora Adicional", enabled: false, unitPrice: 50, quantity: 0, unit: "hora" },
];

export const DEFAULT_DESPESAS: OperationalExpense[] = [
  { id: "combustivel-compra", label: "Combustível p/ comprar mercadoria", enabled: true, type: "fixed", value: 70 },
  { id: "combustivel-evento", label: "Combustível p/ evento", enabled: true, type: "per_km", value: 2.5 },
  { id: "internet", label: "Internet/Despesas digitais", enabled: true, type: "fixed", value: 70 },
  { id: "mao-de-obra", label: "Mão de Obra Atendentes", enabled: true, type: "per_unit", value: 110, quantity: 1 },
  { id: "picagem", label: "Serviço de Picagem de Frutas", enabled: false, type: "fixed", value: 0 },
  { id: "carretinha", label: "Locação da Carretinha", enabled: true, type: "per_unit", value: 100, quantity: 1 },
  { id: "hospedagem", label: "Hospedagem fora de Goiânia", enabled: false, type: "fixed", value: 0 },
];
