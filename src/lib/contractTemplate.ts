import type { ContractCalculatorSnapshot } from "@/lib/generateContractPdf";

export type ContratoData = {
  nomeCliente: string;
  cpfCliente: string;
  enderecoCliente: string;
  telefoneCliente: string;
  email?: string;
  dataEvento: string; // ISO (YYYY-MM-DD ou completo)
  horarioEvento: string;
  localEvento: string;
  convidados: number;
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  numeroOrcamento?: string | null;
  calculatorSnapshot: ContractCalculatorSnapshot | null;
};

export type ContractVariableInfo = {
  key: string;
  description: string;
};

export const CONTRACT_VARIABLES_INFO: ContractVariableInfo[] = [
  { key: "nomeCliente", description: "Nome completo do cliente" },
  { key: "cpfCliente", description: "CPF/CNPJ do cliente" },
  { key: "enderecoCliente", description: "Endereço do cliente" },
  { key: "telefoneCliente", description: "Telefone do cliente" },
  { key: "dataEvento", description: "Data do evento (ex: 29/08/2026)" },
  { key: "dataEventoExtenso", description: "Data por extenso (ex: 29 de agosto de 2026)" },
  { key: "horarioEvento", description: "Horário de início do evento" },
  { key: "horarioFim", description: "Horário de fim (início + duração)" },
  { key: "localEvento", description: "Local/salão do evento" },
  { key: "convidados", description: "Número de convidados" },
  { key: "tempoEvento", description: "Duração em horas (ex: 4)" },
  { key: "tempoEventoExtenso", description: "Duração por extenso (ex: quatro)" },
  { key: "mesaTamanho", description: "Tamanho da mesa em metros" },
  { key: "valorTotal", description: "Valor total formatado (ex: R$ 5.300,00)" },
  { key: "entrada", description: "Valor da entrada formatado" },
  { key: "entradaPercent", description: "Percentual de entrada (ex: 30)" },
  { key: "restante", description: "Valor restante formatado" },
  { key: "restantePercent", description: "Percentual restante" },
  { key: "dataLimitePagamento", description: "Data limite para pagamento (data do evento - 5 dias)" },
  { key: "frutas", description: "Lista das frutas ativas separadas por vírgula" },
  { key: "itensOpcionais", description: "Itens opcionais ativos (Mini Cascata, Hora Adicional)" },
  { key: "observacoes", description: "Observações e itens adicionais" },
  { key: "dataContrato", description: "Data de geração do contrato" },
  { key: "numeroOrcamento", description: "Número do orçamento (ex: ORC-2026-001)" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function dataParaDate(isoDate: string): Date {
  const s = (isoDate || "").trim();
  if (!s) return new Date();
  return s.includes("T") ? new Date(s) : new Date(`${s}T12:00:00`);
}

function formatDataBR(isoDate: string): string {
  try {
    const d = dataParaDate(isoDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "____/____/______";
  }
}

function dataPorExtenso(isoDate: string): string {
  try {
    const d = dataParaDate(isoDate);
    const day = d.getDate();
    const monthNames = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    const month = monthNames[d.getMonth()] ?? "";
    const year = d.getFullYear();
    return `${day} de ${month} de ${year}`;
  } catch {
    return "____ de ____________ de ______";
  }
}

function horarioMaisNHoras(horario: string, horas: number): string {
  try {
    const [h, m] = (horario || "00:00").split(":").map((v) => Number(v) || 0);
    const d = new Date(2000, 0, 1, h, m, 0);
    d.setHours(d.getHours() + horas);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "_____";
  }
}

function tempoEventoExtenso(n: number): string {
  const ext: Record<number, string> = {
    1: "uma",
    2: "duas",
    3: "três",
    4: "quatro",
    5: "cinco",
    6: "seis",
    7: "sete",
    8: "oito",
    9: "nove",
    10: "dez",
  };
  const num = Math.max(1, Math.min(10, Math.round(n || 0)));
  return ext[num] ?? String(num);
}

function dataLimitePagamento(isoDate: string): string {
  try {
    const d = dataParaDate(isoDate);
    d.setDate(d.getDate() - 5);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "____/____/______";
  }
}

export function substituirVariaveis(template: string, dados: ContratoData): string {
  const snapshot = dados.calculatorSnapshot;
  const entradaPercent =
    snapshot?.entradaPercent ?? snapshot?.config?.entryPercent ?? (dados.valorTotal > 0 ? (dados.valorEntrada / dados.valorTotal) * 100 : 30);
  const tempoEvento = Math.max(
    1,
    Math.round(snapshot?.tempoEvento ?? snapshot?.config?.tempoEvento ?? 4)
  );
  const duracaoExtenso = tempoEventoExtenso(tempoEvento);
  const horarioFim = horarioMaisNHoras(dados.horarioEvento, tempoEvento);
  const rawMesa = snapshot?.mesaTamanho ?? snapshot?.config?.mesaTamanho;
  const mesaValor =
    rawMesa != null && String(rawMesa).trim() !== "" && !isNaN(Number(rawMesa))
      ? Number(rawMesa)
      : 2.5;
  const mesaTamanho = mesaValor.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const observacoesTexto = (snapshot?.observacoes ?? "")
    .trim()
    .replace(/["""'']/g, "")   // remover aspas de qualquer tipo
    .replace(/\)+\s*$/, "")    // remover parêntese solto no final
    .trim();
  const frutasAtivas = (snapshot?.frutas ?? []).filter((f) => f.active).map((f) => f.name);
  const frutasTexto =
    frutasAtivas.length > 0
      ? frutasAtivas.join(", ")
      : "Morango, Uva, Kiwi, Banana, Manga, Abacaxi, Melão e Mamão";
  const miniCascataAtiva = (snapshot?.opcionais ?? []).some(
    (o) => o && o.active && (o.id === "mini_cascata" || o.id === "mini-cascata")
  );
  const miniCascataLinha = miniCascataAtiva
    ? "    • 01 Mini Cascata com 1kg de chocolate branco;\n"
    : "";

  const horaAdicional = (snapshot?.opcionais ?? []).find(
    (o) => o && o.active && (o.id === "hora_add" || o.id === "hora-adicional" || o.name?.toLowerCase().includes("hora"))
  );
  const qtdHoras =
    horaAdicional != null
      ? (horaAdicional as { qty?: number; quantidade?: number; value?: number; hours?: number }).qty ??
        (horaAdicional as { quantidade?: number }).quantidade ??
        (horaAdicional as { value?: number }).value ??
        (horaAdicional as { hours?: number }).hours ??
        1
      : 1;
  const horaAdicionalLinha = horaAdicional
    ? `\n    • Hora(s) Adicional(is) contratada(s): ${Number(qtdHoras) || 1}h além do período contratado;`
    : "";

  const opcionaisAtivos = (snapshot?.opcionais ?? [])
    .filter((o) =>
      o &&
      o.active === true &&
      o.id !== "mini_cascata" &&
      o.id !== "mini-cascata" &&
      o.id !== "hora_add" &&
      o.id !== "hora-adicional" &&
      !o.name?.toLowerCase().includes("hora")
    )
    .map((o) => (o && typeof o.name === "string" ? o.name : ""))
    .filter(Boolean)
    .join(", ");

  const observacoesLinhas = observacoesTexto
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[•\-]\s*/, "").trim())
    .filter(Boolean);

  // Se houver observações, lista os itens; se não, gera 3 linhas em branco para preenchimento manual
  const observacoesLinha =
    observacoesLinhas.length > 0
      ? observacoesLinhas.map((l) => `    • ${l}`).join("\n")
      : "    ___________________________________________\n    ___________________________________________\n    ___________________________________________";

  const dataEventoBR = formatDataBR(dados.dataEvento);
  const dataEventoExtenso = dataPorExtenso(dados.dataEvento);
  const dataLimite = dataLimitePagamento(dados.dataEvento);

  const entrada = dados.valorEntrada || (dados.valorTotal * entradaPercent) / 100;
  const restante = dados.valorRestante || dados.valorTotal - entrada;
  const restantePercent = 100 - Math.round(entradaPercent);

  const hoje = new Date();
  const dataContrato = formatDataBR(
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(
      hoje.getDate()
    ).padStart(2, "0")}`
  );

  const replacements: Record<string, string> = {
    nomeCliente: dados.nomeCliente || "—",
    cpfCliente: dados.cpfCliente || "—",
    enderecoCliente: dados.enderecoCliente || "—",
    telefoneCliente: dados.telefoneCliente || "—",
    dataEvento: dataEventoBR,
    dataEventoExtenso,
    horarioEvento: dados.horarioEvento || "_____",
    horarioFim,
    localEvento: dados.localEvento || "_____",
    convidados: String(dados.convidados || 0),
    tempoEvento: String(tempoEvento),
    tempoEventoExtenso: duracaoExtenso,
    mesaTamanho,
    valorTotal: formatCurrency(dados.valorTotal),
    entrada: formatCurrency(entrada),
    entradaPercent: String(Math.round(entradaPercent)),
    restante: formatCurrency(restante),
    restantePercent: String(restantePercent),
    dataLimitePagamento: dataLimite,
    frutas: frutasTexto,
    itensOpcionais: opcionaisAtivos || "—",
    horaAdicionalLinha,
    miniCascataLinha,
    observacoes: observacoesTexto || "—",
    observacoesLinha,
    dataContrato,
    numeroOrcamento: dados.numeroOrcamento || "—",
  };

  return template.replace(/{{(\w+)}}/g, (_, rawKey: string) => {
    const key = rawKey as keyof typeof replacements;
    return replacements[key] ?? `{{${rawKey}}}`;
  });
}

export const DEFAULT_CONTRACT_TEMPLATE = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS – FONDUE DE CHOCOLATE
Goiânia/GO, {{dataEventoExtenso}}.
CONTRATANTE: {{nomeCliente}}, CPF/CNPJ {{cpfCliente}}, residente e domiciliado em {{enderecoCliente}}, telefone {{telefoneCliente}}.
CONTRATADA: Tatiana Ap. Stradioto Cavichioli Carazzatto, CPF 343.434.048-38, endereço Rua 248C, qd.37b Lt.17 - St Coimbra - Goiânia/GO, contato tatistradioto@gmail.com / 62 98254-8965.

1. OBJETO DO CONTRATO
1.1. É objeto do presente contrato a prestação, pela CONTRATADA à CONTRATANTE, dos serviços de Buffet de Fondue de Chocolate com Frutas, a realizar-se na data de {{dataEvento}}, das {{horarioEvento}} às {{horarioFim}}.

2. DO EVENTO
2.1. O evento ocorrerá no local {{localEvento}}, com a presença estimada de {{convidados}} convidados.
2.2. O serviço de fondue será prestado por {{tempoEvento}} ({{tempoEventoExtenso}}) horas, iniciando-se às {{horarioEvento}} e encerrando-se às {{horarioFim}}.
2.3. O CONTRATANTE se compromete a disponibilizar uma mesa com, no mínimo, {{mesaTamanho}} metro(s) de comprimento, em local abrigado de corrente de ar ou ventanias.

3. OBRIGAÇÕES DO CONTRATANTE
3.1. Fornecer todas as informações necessárias para a correta execução do serviço.
3.2. Garantir o acesso da CONTRATADA ao local do evento com antecedência mínima de 2 (duas) horas do horário de início para montagem.
3.3. Disponibilizar ponto de energia próximo à mesa do fondue para funcionamento dos equipamentos.

4. OBRIGAÇÕES DA CONTRATADA
4.1. Fornecer produtos de boa qualidade, preparados e servidos dentro de rigorosas normas de higiene.
4.2. Fornecer os seguintes itens:
    • Atendente para manuseio da fonte de chocolate;
    • Cascata de chocolate profissional com 1 metro de altura;
    • Chocolate nobre de boa procedência;
    • Frutas selecionadas: {{frutas}};
{{miniCascataLinha}}    • Taças de vidros de diversos modelos;
    • Cubos de espelhos para ornamentação e embelezamento da mesa;
    • Deslocamento incluso.
{{horaAdicionalLinha}}

5. DAS OBSERVAÇÕES ESPECÍFICAS DO EVENTO
5.1. Condições especiais acordadas entre as partes para este evento:
{{observacoesLinha}}

6. DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
6.1. Pelos serviços contratados, a CONTRATANTE pagará o valor total de {{valorTotal}}.
6.2. Na data da assinatura deste contrato, será paga a quantia de {{entrada}} ({{entradaPercent}}% do valor total) a título de entrada.
6.3. O valor restante de {{restante}} ({{restantePercent}}% do valor total) deverá ser pago até {{dataLimitePagamento}}.
Pagamento via: Caixa Econômica Federal - AG: 3037 / CC: 28655-0 / OP: 013 - ou PIX: 62 982548965 (PagSeguro), em nome de Tatiana A Stradioto.

7. DO INADIMPLEMENTO
7.1. O não pagamento nas datas ajustadas poderá implicar no cancelamento do serviço ou cobrança de multa, a critério da CONTRATADA.

8. DA RESCISÃO
8.1. O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação por escrito, com antecedência mínima de 10 (dez) dias da data do evento.

9. DAS MULTAS CONTRATUAIS
9.1. Em caso de rescisão antecipada ou inadimplemento, a parte infratora pagará multa equivalente a 30% (trinta por cento) sobre o valor total do contrato.

10. DO FORO
10.1. Para dirimir quaisquer controvérsias oriundas deste contrato, fica eleito o foro da comarca de Goiânia/GO, com renúncia a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justos e contratados, firmam o presente instrumento.
Goiânia/GO, {{dataContrato}}.
Contrato referente ao orçamento nº {{numeroOrcamento}}.
`;