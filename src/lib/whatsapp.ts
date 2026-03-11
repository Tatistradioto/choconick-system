const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export type PropostaParams = {
  convidados: number;
  valorTotal: number;
  valorEntrada: number; // ex: 30% do total
  numeroOrcamento?: string;
  dataOrcamento?: string;
  nomeCliente?: string;
};

/**
 * Texto completo da proposta comercial para copiar ou enviar por WhatsApp.
 */
export function getPropostaText(params: PropostaParams): string {
  const { convidados, valorTotal, valorEntrada, numeroOrcamento, dataOrcamento, nomeCliente } = params;
  const headerBlock =
    numeroOrcamento || dataOrcamento || nomeCliente
      ? [
          numeroOrcamento ? `📋 Orçamento: ${numeroOrcamento}` : "",
          dataOrcamento ? `📅 Data: ${dataOrcamento}` : "",
          nomeCliente ? `👤 Cliente: ${nomeCliente}` : "",
        ]
          .filter(Boolean)
          .join("\n") + "\n\n"
      : "";
  return `*CHOCONICK FONDUE* – É o fondue que todo mundo fotografa, todo mundo repete e que transforma qualquer festa em evento inesquecível.

${headerBlock}

Considerando que a mesa de fondue será servida juntamente com uma estrutura equilibrada de alimentação: Entrada (mesa de frios/petiscos/salgadinhos) → Almoço/Jantar → Bebidas → Bolo.

👥 Para *${convidados} convidados* → *Valor total ${fmt(valorTotal)}*
💰 Reserva da data: *30% de entrada → ${fmt(valorEntrada)}*
📆 O valor restante pode ser parcelado (pagamento mensal via pix) até o mês do evento.
- O contrato deverá estar quitado *até 5 dias antes da festa* para confirmação do serviço.

💳 *Formas de pagamento:*
✅ PIX ou Transferência Bancária nas datas combinadas e registradas no contrato.
🚫 *Não aceitamos pagamento por cartão de crédito ou débito.*

✨ *O que você está levando (e ninguém mais entrega em Goiânia):*
* Cascata profissional de 1 metro com *chocolate NOBRE PURO*
* 8 tipos de frutas frescas (morango, uva, kiwi, abacaxi, manga, banana, melão e mamão)
* Taças de vidro + cubos espelhados
* Guarnições: leite condensado, granulado, coco ralado e marshimellow
* Todos os descartáveis (potinhos, colherzinhas, guardanapos)
* *Atendentes por 4 horas*
* Deslocamento incluso
*Montagem ocorre em 3 horas, antes do horário combinado*

🚨 *Atenção especial:*
Quando o evento *NÃO* segue estrutura equilibrada de alimentação, o consumo aumenta excessivamente, reduzindo o tempo de *4 para aproximadamente 2 horas.*

📝 _Este orçamento é válido por 7 dias e poderá sofrer alteração após esse período._`;
}

/**
 * URL do WhatsApp para enviar a proposta (com ou sem número).
 */
export function buildPropostaUrl(telefone: string | null, textoProposta: string): string {
  const encoded = encodeURIComponent(textoProposta);
  const base = "https://wa.me/";
  if (telefone && telefone.replace(/\D/g, "").length >= 10) {
    return `${base}55${telefone.replace(/\D/g, "")}?text=${encoded}`;
  }
  return `${base}?text=${encoded}`;
}

export type ContratoParams = {
  nomeCliente: string;
  dataEvento: string; // ex: "15/03/2025" ou "A definir"
  convidados: number;
  valorTotal: number;
};

/**
 * Mensagem para enviar contrato por WhatsApp.
 */
export function getContratoMessage(params: ContratoParams): string {
  const { nomeCliente, dataEvento, convidados, valorTotal } = params;
  return `Olá *${nomeCliente || "cliente"}*! 🍓

Segue o contrato referente ao seu evento:
📅 Data: *${dataEvento}*
👥 Convidados: *${convidados}*
💰 Valor Total: *${fmt(valorTotal)}*

Por favor, leia com atenção e confirme o recebimento.

Qualquer dúvida estou à disposição!
*ChocoNick Fondue* 🍫`;
}

/**
 * URL do WhatsApp para enviar o contrato (com ou sem número).
 */
export function buildContratoUrl(telefone: string | null, textoContrato: string): string {
  const encoded = encodeURIComponent(textoContrato);
  const base = "https://wa.me/";
  if (telefone && telefone.replace(/\D/g, "").length >= 10) {
    return `${base}55${telefone.replace(/\D/g, "")}?text=${encoded}`;
  }
  return `${base}?text=${encoded}`;
}
