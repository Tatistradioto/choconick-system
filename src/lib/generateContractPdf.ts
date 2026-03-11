import { jsPDF } from "jspdf";
import { format, parseISO, addHours, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TIMBRADO_BASE64 } from "@/lib/timbradoBase64";
import { ASSINATURA_BASE64 } from "@/lib/assinaturaBase64";

// ─── Página A4 ────────────────────────────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;
const ML     = 18;
const MR     = 18;
const CW     = PAGE_W - ML - MR; // 174mm

// ─── Timbrado: imagem 1414×2000px = A4 inteiro ────────────────────────────────
const CS  = 50;
const CE  = 276;
const PNY = 289;

// ─── Tipografia ───────────────────────────────────────────────────────────────
const LH   = 4.8;
const LH_S = 4.2;
const GAP  = 2.5;
const GAP_C = 5;

// ─── Meses ────────────────────────────────────────────────────────────────────
const MESES: Record<number, string> = {
  1:"janeiro",2:"fevereiro",3:"março",4:"abril",5:"maio",6:"junho",
  7:"julho",8:"agosto",9:"setembro",10:"outubro",11:"novembro",12:"dezembro",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type ContractCalculatorSnapshot = {
  entradaPercent?: number;
  config?: { entryPercent?: number; mesaTamanho?: number; tempoEvento?: number };
  mesaTamanho?: number;
  tempoEvento?: number;
  observacoes?: string;
  frutas?: { name: string; active: boolean }[];
  opcionais?: {
    id: string; name: string; active: boolean;
    qty?: number; quantidade?: number; value?: number; hours?: number;
  }[];
};

export type ContractPdfData = {
  nomeCliente: string;
  cpfCnpj: string;
  enderecoCliente: string;
  telefone: string;
  email: string;
  dataEvento: string;
  horarioEvento: string;
  localEvento: string;
  convidados: number;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  calculatorSnapshot?: ContractCalculatorSnapshot | null;
  contratoTexto?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDate(iso: string): Date {
  const s = (iso || "").trim();
  if (!s) return new Date();
  return s.includes("T") ? parseISO(s) : new Date(`${s}T12:00:00`);
}
function fmtBR(iso: string) {
  try { return format(toDate(iso), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return "__/__/____"; }
}
function fmtExtenso(iso: string) {
  try {
    const d = toDate(iso);
    return `${d.getDate()} de ${MESES[d.getMonth() + 1]} de ${d.getFullYear()}`;
  } catch { return "__ de ______ de ____"; }
}
function addH(h: string, n: number) {
  try {
    const [hh, mm] = (h || "00:00").split(":").map(Number);
    return format(addHours(new Date(2000, 0, 1, hh || 0, mm || 0), n), "HH:mm");
  } catch { return "_____"; }
}
function subD5(iso: string) {
  try { return format(subDays(toDate(iso), 5), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return "__/__/____"; }
}
function numExtenso(n: number) {
  const e: Record<number, string> = {
    1:"uma",2:"duas",3:"três",4:"quatro",5:"cinco",
    6:"seis",7:"sete",8:"oito",9:"nove",10:"dez",
  };
  return e[Math.max(1, Math.min(10, Math.round(n)))] ?? String(n);
}
function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", minimumFractionDigits: 2,
  }).format(v);
}

// ─── Timbrado ─────────────────────────────────────────────────────────────────
function addTimbrado(doc: jsPDF, pg: number) {
  doc.addImage(TIMBRADO_BASE64, "JPEG", 0, 0, PAGE_W, PAGE_H);
  // Cobre o "1 / 2" gravado na imagem do rodapé
  doc.setFillColor(42, 18, 4);
  doc.rect(PAGE_W / 2 - 25, 283, 50, 12, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(190, 145, 70);
  doc.text(`Página ${pg} / ${doc.getNumberOfPages()}`, PAGE_W / 2, 288, { align: "center" });
}

// ─── Gerador ──────────────────────────────────────────────────────────────────
export function generateContractPdf(data: ContractPdfData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const sn = data.calculatorSnapshot;

  let pg = 1;
  let y  = CS;

  const np = () => {
    doc.addPage();
    pg++;
    addTimbrado(doc, pg);
    y = CS;
    doc.setTextColor(0, 0, 0);
  };

  const chk = (h: number) => { if (y + h > CE) np(); };

  const wr = (txt: string, x = ML, w = CW, lh = LH): string[] => {
    const lines = doc.splitTextToSize(txt, w);
    doc.text(lines, x, y);
    y += lines.length * lh;
    return lines;
  };

  const body = (sz = 9.5) => {
    doc.setFontSize(sz);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
  };

  // ── Extrair dados ─────────────────────────────────────────────────────────
  const tempo    = Math.max(1, Math.round(sn?.tempoEvento ?? sn?.config?.tempoEvento ?? 4));
  const mesa     = Number(sn?.mesaTamanho ?? sn?.config?.mesaTamanho ?? 2.5) || 2.5;
  const epct     = sn?.entradaPercent ?? sn?.config?.entryPercent ?? 30;
  const entrada  = data.valorEntrada  || (data.valorTotal * epct / 100);
  const restante = data.valorRestante || (data.valorTotal - entrada);
  const hrFim    = addH(data.horarioEvento, tempo);
  const dataBR   = fmtBR(data.dataEvento);
  const dataExt  = fmtExtenso(data.dataEvento);
  const dataLim  = subD5(data.dataEvento);
  const hoje     = format(new Date(), "dd/MM/yyyy", { locale: ptBR });

  const frutas = (sn?.frutas ?? []).filter(f => f.active).map(f => f.name);
  const frutasTxt = frutas.length > 0
    ? frutas.join(", ")
    : "Morango, Uva, Kiwi, Banana, Manga, Abacaxi, Melão e Mamão";

  const miniOp = (sn?.opcionais ?? []).find(
    o => o.active && (o.id === "mini_cascata" || o.id === "mini-cascata")
  );
  const horaOp = (sn?.opcionais ?? []).find(
    o => o.active && (o.id === "hora_add" || o.id === "hora-adicional" || o.name?.toLowerCase().includes("hora"))
  );
  const qtdH = Number((horaOp as any)?.qty ?? (horaOp as any)?.quantidade ?? (horaOp as any)?.value ?? 1);

  const obs = (sn?.observacoes ?? "")
    .trim()
    .replace(/["""'']/g, "")
    .replace(/\)+\s*$/, "")
    .trim();

  const temObs = obs.length > 0;

  // Numeração dinâmica das cláusulas (obs empurra +1 a partir da 5ª)
  const nc = (base: number) => String(temObs ? base + 1 : base);

  // ══════════════════════════════════════════════════════════════════════════
  // TIMBRADO
  // ══════════════════════════════════════════════════════════════════════════
  addTimbrado(doc, pg);

  // ── CABEÇALHO ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", PAGE_W / 2, y, { align: "center" });
  y += LH + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(70, 70, 70);
  doc.text("Fondue de Chocolate com Frutas", PAGE_W / 2, y, { align: "center" });
  y += LH + 2;

  doc.setDrawColor(160, 120, 60);
  doc.setLineWidth(0.5);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 4;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`Goiânia/GO, ${dataExt}.`, PAGE_W - MR, y, { align: "right" });
  y += LH + 4;

  // ── PARTES ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text("PARTES CONTRATANTES", ML, y);
  y += LH + 0.5;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 3.5;

  const parLine = (label: string, value: string) => {
    doc.setFontSize(9);
    const lw = doc.getTextWidth(label);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(label, ML, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, CW - lw - 1);
    doc.text(lines[0] ?? "", ML + lw + 0.5, y);
    y += LH_S;
    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i], ML + lw + 0.5, y);
      y += LH_S;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text("CONTRATANTE:", ML, y);
  y += LH_S + 0.5;
  doc.setTextColor(0, 0, 0);
  parLine("Nome: ", data.nomeCliente || "—");
  parLine("CPF/CNPJ: ", data.cpfCnpj || "—");
  parLine("Endereço: ", data.enderecoCliente || "—");
  parLine("Telefone: ", data.telefone || "—");
  y += 2;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.15);
  doc.line(ML, y, PAGE_W - MR - 15, y);
  y += 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text("CONTRATADA:", ML, y);
  y += LH_S + 0.5;
  doc.setTextColor(0, 0, 0);
  parLine("Nome: ", "Tatiana Ap. Stradioto Cavichioli Carazzatto");
  parLine("CPF: ", "343.434.048-38");
  parLine("Endereço: ", "Rua 248C, qd.37b Lt.17 - St Coimbra - Goiânia/GO");
  parLine("Contato: ", "tatistradioto@gmail.com / 62 98254-8965");
  y += 3;

  doc.setDrawColor(160, 120, 60);
  doc.setLineWidth(0.5);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 5;

  // ── TEXTO INTRODUTÓRIO ────────────────────────────────────────────────────
  body(9.5);
  doc.setFont("helvetica", "italic");
  wr("As partes acima identificadas têm, entre si, justas e acertadas o presente Contrato de Prestação de Serviços de Buffet de Chocolate com Frutas, que se regerá pelas cláusulas seguintes e pelas condições de preços, forma e termo de pagamento descritos no presente instrumento.");
  y += 4;
  doc.setFont("helvetica", "normal");

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const titulo = (txt: string) => {
    chk(GAP_C + LH * 3);
    y += GAP_C;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(txt, ML, y);
    y += LH + 1.5;
    body(9.5);
  };

  const item = (num: string, txt: string) => {
    chk(LH * 2);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(num, ML, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(txt, CW - 12);
    doc.text(lines, ML + 12, y);
    y += lines.length * LH + GAP;
  };

  const bullet = (txt: string) => {
    chk(LH);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("•", ML + 6, y);
    const lines = doc.splitTextToSize(txt, CW - 14);
    doc.text(lines, ML + 11, y);
    y += lines.length * LH + 0.8;
  };

  // Renderiza texto com fundo amarelo (highlight)
  const highlight = (txt: string, x = ML, w = CW, lh = LH) => {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(txt, w);
    const boxH = lines.length * lh + 1;
    doc.setFillColor(255, 255, 180);
    doc.rect(x - 1, y - lh + 1, w + 2, boxH, "F");
    doc.setTextColor(0, 0, 0);
    doc.text(lines, x, y);
    y += lines.length * lh;
  };

  // Parágrafo único inline (bold label + normal texto)
  const paragrafoUnico = (txt: string) => {
    chk(LH * 3);
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    const label = "Parágrafo único. ";
    const lw = doc.getTextWidth(label);
    doc.text(label, ML, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(txt, CW - lw);
    doc.text(lines[0] ?? "", ML + lw, y);
    y += LH;
    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i], ML, y);
      y += LH;
    }
    y += GAP;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CLÁUSULAS
  // ══════════════════════════════════════════════════════════════════════════

  // 1. OBJETO
  titulo("1. OBJETO DO CONTRATO");
  chk(LH * 3);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text("1.1.", ML, y);
  doc.setFont("helvetica", "normal");
  const txt11a = `É objeto do presente contrato a prestação pela CONTRATADA à CONTRATANTE dos serviços de Buffet de Chocolate com Frutas, em evento que se realizará na data de `;
  const txt11b = `${dataBR}, a partir das ${data.horarioEvento} horas.`;
  const w11 = CW - 12;
  {
    const lines1 = doc.splitTextToSize(txt11a + txt11b, w11);
    const boxH = lines1.length * LH + 1;
    doc.setFillColor(255, 255, 180);
    doc.rect(ML + 11, y - LH + 1, w11 + 2, boxH, "F");
    doc.setTextColor(0,0,0);
    doc.text(lines1, ML + 12, y);
    y += lines1.length * LH + GAP;
  }

  // 2. DO EVENTO
  titulo("2. DO EVENTO");
  chk(LH * 3);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text("2.1.", ML, y);
  doc.setFont("helvetica", "normal");
  {
    const txt = `O evento, para cuja realização será contratado o serviço de Fondue de Chocolate com Frutas, ocorrerá no local: ${data.localEvento || "_____"}`;
    const w21 = CW - 12;
    const lines = doc.splitTextToSize(txt, w21);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML + 11, y - LH + 1, w21 + 2, lines.length * LH + 1, "F");
    doc.setTextColor(0,0,0);
    doc.text(lines, ML + 12, y);
    y += lines.length * LH + GAP;
  }
  chk(LH * 2);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text("2.2.", ML, y);
  doc.setFont("helvetica", "normal");
  {
    const txt = `O evento contará com a presença estimada de (${data.convidados || 0}) pessoas.`;
    const w22 = CW - 12;
    const lines = doc.splitTextToSize(txt, w22);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML + 11, y - LH + 1, w22 + 2, lines.length * LH + 1, "F");
    doc.setTextColor(0,0,0);
    doc.text(lines, ML + 12, y);
    y += lines.length * LH + GAP;
  }
  chk(LH * 3);
  {
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    const label = "Parágrafo único. ";
    const lw = doc.getTextWidth(label);
    const restTxt = `O evento realizar-se-á no horário e local indicados na cláusula 1ª, devendo o serviço de fondue ser prestado no período de ${tempo} (${numExtenso(tempo)}) horas, tendo início às ${data.horarioEvento} horas e finalizando às ${hrFim} horas.`;
    const fullTxt = label + restTxt;
    const lines = doc.splitTextToSize(fullTxt, CW);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML - 1, y - LH + 1, CW + 2, lines.length * LH + 1, "F");
    doc.text(label, ML, y);
    doc.setFont("helvetica", "normal");
    const restLines = doc.splitTextToSize(restTxt, CW - lw);
    doc.text(restLines[0] ?? "", ML + lw, y);
    y += LH;
    for (let i = 1; i < restLines.length; i++) {
      doc.text(restLines[i], ML, y);
      y += LH;
    }
    y += GAP;
  }

  // 3. OBRIGAÇÕES DO CONTRATANTE
  titulo("3. OBRIGAÇÕES DO CONTRATANTE");
  item("3.1.", "O CONTRATANTE deverá fornecer à CONTRATADA todas as informações necessárias à realização adequada do serviço.");
  item("3.2.", "O CONTRATANTE compromete-se a deixar o local do evento autorizado para acesso livre na data do evento a partir das 09:00 horas da manhã, ou 3 horas antes do início do evento, para montagem da mesa de fondue.");
  chk(LH * 3);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("3.3.", ML, y);
  doc.setFont("helvetica", "normal");
  {
    const txt = "O CONTRATANTE deverá fornecer ponto de energia próximo à mesa para funcionamento da máquina de chocolate.";
    const w33 = CW - 12;
    const lines = doc.splitTextToSize(txt, w33);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML + 11, y - LH + 1, w33 + 2, lines.length * LH + 1, "F");
    doc.setTextColor(0, 0, 0);
    doc.text(lines, ML + 12, y);
    y += lines.length * LH + GAP;
  }
  chk(LH * 3);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text(`${nc(3)}.4.`, ML, y);
  doc.setFont("helvetica", "normal");
  {
    const txt = `O CONTRATANTE deverá fornecer uma mesa firme e resistente, com medidas iguais ou maiores a ${mesa.toLocaleString("pt-BR")} metros de comprimento, adequada para suportar o peso dos equipamentos.`;
    const w34 = CW - 12;
    const lines = doc.splitTextToSize(txt, w34);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML + 11, y - LH + 1, w34 + 2, lines.length * LH + 1, "F");
    doc.setTextColor(0,0,0);
    doc.text(lines, ML + 12, y);
    y += lines.length * LH + GAP;
  }
  chk(LH * 3);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text(`${nc(3)}.5.`, ML, y);
  doc.setFont("helvetica", "normal");
  {
    const txt = "A mesa não deverá estar em local onde haja muita corrente de ar ou ventania, pois isso pode comprometer o funcionamento da fonte de chocolate.";
    const w35 = CW - 12;
    const lines = doc.splitTextToSize(txt, w35);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML + 11, y - LH + 1, w35 + 2, lines.length * LH + 1, "F");
    doc.setTextColor(0,0,0);
    doc.text(lines, ML + 12, y);
    y += lines.length * LH + GAP;
  }
  item("3.6.", `O CONTRATANTE deverá efetuar o pagamento conforme condições estabelecidas na cláusula ${nc(5)} deste contrato.`);

  // 4. OBRIGAÇÕES DA CONTRATADA
  titulo("4. OBRIGAÇÕES DA CONTRATADA");
  item("4.1.", "A CONTRATADA compromete-se a fornecer produtos de qualidade, preparados e servidos dentro de rigorosas normas de higiene.");
  item("4.2.", "A CONTRATADA se compromete a fornecer os seguintes itens para realização do evento, em quantidade previamente calculada para atender o número de convidados informado na cláusula 2 deste contrato:");

  bullet("Atendente para manusear a fonte de chocolate;");
  bullet("1 fonte profissional (1 mt de altura);");
  bullet("Chocolate nobre de boa procedência;");
  bullet(`${frutas.length > 0 ? frutas.length : 8} tipos de frutas: ${frutasTxt};`);
  if (miniOp) bullet("01 Mini Cascata com 1kg de chocolate branco;");
  bullet("Guarnições: chocolate granulado e coco ralado;");
  bullet("Marshmallow;");
  bullet("Leite condensado;");
  bullet("Taças de vidro de diversos modelos;");
  bullet("Cubos de espelhos para ornamentação e embelezamento da mesa;");
  bullet("Descartáveis: potinhos, colherzinhas e guardanapos.");
  if (horaOp) bullet(`Hora(s) Adicional(is) contratada(s): ${qtdH}h além do período contratado.`);
  y += 1;

  paragrafoUnico("A CONTRATADA não trabalha com reposição de produtos durante o evento, sendo disponibilizada quantidade suficiente para atender o número de convidados informado pelo CONTRATANTE.");

  // 5. OBSERVAÇÕES — só se existir na calculadora
  if (temObs) {
    titulo("5. DAS OBSERVAÇÕES ESPECÍFICAS DO EVENTO");
    item("5.1.", "Condições especiais acordadas entre as partes para este evento:");
    obs.split(/\r?\n/).filter(l => l.trim()).forEach(l => bullet(l.replace(/^[•\-]\s*/, "")));
    y += 1;
  }

  // 5 ou 6. PREÇO E PAGAMENTO
  titulo(`${nc(5)}. DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO`);
  chk(LH * 4);
  {
    const txt = `O serviço contratado no presente instrumento será remunerado pela quantia de ${fmt(data.valorTotal)}, sendo que ${Math.round(epct)}% (${fmt(entrada)}) do valor deverá ser pago na emissão deste contrato, e o restante do valor (${fmt(restante)}) deverá ser pago até o dia ${dataLim} — 05 dias antes da realização do evento.`;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0,0,0);
    const lines = doc.splitTextToSize(txt, CW);
    doc.setFillColor(255, 255, 180);
    doc.rect(ML - 1, y - LH + 1, CW + 2, lines.length * LH + 1, "F");
    doc.text(lines, ML, y);
    y += lines.length * LH + GAP;
  }
  // Linha 1 — texto corrido até "PIX"
  const bancLine1 = "Dados da conta bancária: Caixa Econômica Federal – Agência 3037, Conta Corrente 28655-0, Operação 013. Ou, se preferir, via ";
  const bancPix   = "PIX";
  const bancLine2 = " nº. ";
  const bancNum   = "62 98254-8965";
  const bancLine3 = " – PagSeguro, em nome de Tatiana A. Stradioto.";

  {
    const x0 = ML;
    const maxW = CW;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // Monta o texto completo para quebra de linha automática
    const fullText = bancLine1 + bancPix + bancLine2 + bancNum + bancLine3;
    const lines = doc.splitTextToSize(fullText, maxW);

    // Renderiza linha a linha, destacando PIX e o número
    for (const line of lines) {
      let cursor = x0;
      // Divide a linha nos tokens que devem ser destacados
      const parts = line.split(/(PIX|62 98254-8965)/g);
    for (const part of parts) {
      const isBold = part === "PIX" || part === "62 98254-8965";
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(part, cursor, y);
      cursor += doc.getTextWidth(part);
    }
    y += LH + 2;
  }
  }
  y += GAP;

  // Inadimplemento
  titulo(`${nc(6)}. DO INADIMPLEMENTO`);
  item(`${nc(6)}.1.`, "Em caso de inadimplemento por parte do CONTRATANTE quanto ao pagamento do serviço contratado, a prestação do serviço por parte da CONTRATADA poderá ser cancelada.");

  // Rescisão
  titulo(`${nc(7)}. DA RESCISÃO`);
  item(`${nc(7)}.1.`, "O presente contrato poderá ser rescindido por qualquer uma das partes, mediante comunicação formal por escrito, com antecedência mínima de 10 (dez) dias corridos antes da data prevista para o evento.");

  // Multas
  titulo(`${nc(8)}. DAS MULTAS CONTRATUAIS`);
  item(`${nc(8)}.1.`, "A parte que descumprir quaisquer cláusulas do presente contrato pagará à parte prejudicada multa equivalente a 30% (trinta por cento) do valor total do contrato, sem prejuízo de eventuais perdas e danos.");

  // Danos aos Equipamentos
  titulo(`${nc(9)}. DOS DANOS AOS EQUIPAMENTOS`);
  item(`${nc(9)}.1.`, "Todos os equipamentos e materiais utilizados na prestação do serviço são de propriedade da CONTRATADA, devendo ser preservados durante todo o período do evento.");
  item(`${nc(9)}.2.`, "O CONTRATANTE se responsabiliza pela qualidade e resistência da mesa disponibilizada, devendo esta ser firme e adequada para suportar o peso dos equipamentos.");
  item(`${nc(9)}.3.`, "Caso ocorra queda, dano ou quebra de equipamentos em decorrência de mesa fraca, instável ou inadequada, o CONTRATANTE será responsável pelo ressarcimento integral dos prejuízos.");
  item(`${nc(9)}.4.`, "Danos causados por convidados, terceiros ou uso inadequado também deverão ser ressarcidos pelo CONTRATANTE.");

  // Foro
  titulo(`${nc(10)}. DO FORO`);
  item(`${nc(10)}.1.`, "Para dirimir quaisquer controvérsias oriundas do presente contrato, as partes elegem o Foro da Comarca de Goiânia – GO.");

  // ── FECHO ─────────────────────────────────────────────────────────────────
  chk(LH * 3);
  y += 2;
  body(9.5);
  wr("Por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor.");
  y += 1;
  const hojeD = new Date();
  wr(`Goiânia, ${hojeD.getDate()} de ${MESES[hojeD.getMonth() + 1]} de ${hojeD.getFullYear()}.`);
  y += 1;

  // ── ASSINATURAS ───────────────────────────────────────────────────────────
  if (y + 30 > CE) np();

  y += 10;

  y += 9;

  const cL = ML;
  const cR = PAGE_W / 2 + 6;
  const sw  = (PAGE_W / 2) - ML - 8;

  // Assinatura da CONTRATADA acima da linha direita
  const sigH = 14; // altura da imagem em mm
  const sigW = 40; // largura da imagem em mm
  try {
    doc.addImage(
      ASSINATURA_BASE64,
      "PNG",
      cR + (sw - sigW) / 2, // centraliza sobre a linha da CONTRATADA
      y - sigH + 4,          // posiciona logo acima da linha
      sigW,
      sigH,
    );
  } catch {
    // Se a imagem ainda não foi substituída (placeholder), ignora silenciosamente
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(cL, y, cL + sw, y);
  doc.line(cR, y, cR + sw, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("CONTRATANTE", cL, y);
  doc.text("CONTRATADA",  cR, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.nomeCliente || "—", cL, y);
  doc.text("ChocoNick Fondue", cR, y);
  y += 4;
  doc.text(`CPF/CNPJ: ${data.cpfCnpj || "—"}`, cL, y);
  doc.text("Tatiana Ap. Stradioto Cavichioli Carazzatto", cR, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("CPF: 343.434.048-38", cR, y);

  // ── SALVAR ────────────────────────────────────────────────────────────────
  const safe = (data.nomeCliente || "Cliente")
    .normalize("NFD")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  const dEvt = data.dataEvento
    ? format(toDate(data.dataEvento), "yyyy-MM-dd", { locale: ptBR })
    : "sem_data";
  doc.save(`Contrato_ChocoNick_${safe}_${dEvt}.pdf`);
}