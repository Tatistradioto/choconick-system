import { jsPDF } from "jspdf";

const ORANGE = { r: 255, g: 107, b: 43 };
const MARGIN = 20;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H = 6;
const SECTION_GAP = 8;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export type PropostaPdfData = {
  convidados: number;
  precoDeVenda: number;
  nomeCliente: string;
  numeroOrcamento?: string;
  dataOrcamento?: string;
};

export function generatePropostaPdf(data: PropostaPdfData): void {
  const doc = new jsPDF();
  const { convidados, precoDeVenda, nomeCliente, numeroOrcamento, dataOrcamento } = data;
  const entrada = precoDeVenda * 0.3;

  let y = MARGIN;

  // ----- CABEÇALHO -----
  doc.setFontSize(22);
  doc.setTextColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setFont("helvetica", "bold");
  doc.text("CHOCONICK FONDUE", MARGIN, y);
  y += LINE_H + 2;

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "italic");
  doc.text(
    "É o fondue que todo mundo fotografa, todo mundo repete e que transforma qualquer festa em evento inesquecível.",
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += LINE_H * 2 + SECTION_GAP;

  if (numeroOrcamento || dataOrcamento || nomeCliente) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (numeroOrcamento) {
      doc.text(`Orçamento: ${numeroOrcamento}`, MARGIN, y);
      y += LINE_H;
    }
    if (dataOrcamento) {
      doc.text(`Data: ${dataOrcamento}`, MARGIN, y);
      y += LINE_H;
    }
    if (nomeCliente) {
      doc.text(`Cliente: ${nomeCliente}`, MARGIN, y);
      y += LINE_H;
    }
    y += SECTION_GAP;
  }

  // ----- CORPO -----
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text(
    "Considerando que a mesa de fondue será servida juntamente com uma estrutura equilibrada de alimentação: Entrada → Almoço/Jantar → Bebidas → Bolo.",
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += LINE_H * 2 + 4;

  doc.text(`👥 Para ${convidados} convidados → Valor total ${formatCurrency(precoDeVenda)}`, MARGIN, y);
  y += LINE_H;

  doc.text(`💰 Reserva da data: 30% de entrada → ${formatCurrency(entrada)}`, MARGIN, y);
  y += LINE_H;

  doc.text(
    "📆 O valor restante pode ser parcelado (pagamento mensal via pix) até o mês do evento.",
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += LINE_H;

  doc.text(
    "O contrato deverá estar quitado até 5 dias antes da festa para confirmação do serviço.",
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += LINE_H * 2 + SECTION_GAP;

  // ----- FORMAS DE PAGAMENTO -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FORMAS DE PAGAMENTO:", MARGIN, y);
  y += LINE_H;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "✅ PIX ou Transferência Bancária nas datas combinadas e registradas no contrato.",
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += LINE_H;
  doc.text("🚫 Não aceitamos pagamento por cartão de crédito ou débito.", MARGIN, y);
  y += LINE_H * 2 + SECTION_GAP;

  // ----- O QUE VOCÊ ESTÁ LEVANDO -----
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("O QUE VOCÊ ESTÁ LEVANDO:", MARGIN, y);
  y += LINE_H;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const itensLeva = [
    "Cascata profissional de 1 metro com chocolate NOBRE PURO (sem fracionado, sem gordura vegetal)",
    "8 tipos de frutas frescas da estação (morango, uva, kiwi, abacaxi, manga, banana, melão e mamão)",
    "Taças de vidro + cubos espelhados",
    "Guarnições: leite condensado, granulado, coco ralado e marshimellow",
    "Todos os descartáveis (potinhos, colherzinhas, guardanapos)",
    "Atendentes por 4 horas",
    "Deslocamento incluso",
    "Montagem ocorre em 3 horas, antes do horário combinado",
  ];
  for (const linha of itensLeva) {
    doc.text(linha, MARGIN, y, { maxWidth: CONTENT_W });
    y += LINE_H;
  }
  y += SECTION_GAP;

  // ----- ATENÇÃO ESPECIAL (bloco laranja) -----
  const blockY = y;
  const blockH = 28;
  doc.setFillColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.rect(MARGIN, blockY, CONTENT_W, blockH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("ATENÇÃO ESPECIAL", MARGIN + 4, blockY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "O fondue é calculado por pessoa com base em eventos que possuem uma estrutura equilibrada de alimentação.",
    MARGIN + 4,
    blockY + 16,
    { maxWidth: CONTENT_W - 8 }
  );
  doc.text(
    "Quando o evento NÃO segue essa estrutura, o consumo aumenta excessivamente, reduzindo o tempo de pra menos de 4 horas.",
    MARGIN + 4,
    blockY + 24,
    { maxWidth: CONTENT_W - 8 }
  );
  y = blockY + blockH + SECTION_GAP;

  // ----- RODAPÉ -----
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "📝 Este orçamento é válido por 7 dias e poderá sofrer alteração após esse período.",
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += LINE_H + 2;

  const dataGeracao = formatDate(new Date());
  doc.text(`Data de geração: ${dataGeracao}`, MARGIN, y);
  y += LINE_H;

  if (nomeCliente.trim()) {
    doc.text(`Cliente: ${nomeCliente.trim()}`, MARGIN, y);
  }

  // ----- DOWNLOAD -----
  const safeName = nomeCliente.trim() ? nomeCliente.trim().replace(/\s+/g, "_") : "Cliente";
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Proposta_ChocoNick_${safeName}_${dateStr}.pdf`;
  doc.save(filename);
}
