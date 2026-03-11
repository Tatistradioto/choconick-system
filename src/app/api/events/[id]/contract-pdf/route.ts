import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: client } = await supabase.from("clients").select("*").eq("id", event.client_id).single();
  const { data: settings } = await supabase.from("settings").select("contract_forum").eq("user_id", user.id).single();

  const dateStr = event.event_date ? format(event.event_date, "dd/MM/yyyy", { locale: ptBR }) : "—";
  const timeStr = event.event_time ? String(event.event_time).slice(0, 5) : "—";
  const forum = settings?.contract_forum || "comarca da cidade da empresa";

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato ${event.contract_number || eventId}</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 12px; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 24px; line-height: 1.5; }
    h1 { font-size: 16px; text-align: center; margin-bottom: 24px; }
    h2 { font-size: 13px; margin: 16px 0 8px; }
    p { margin: 8px 0; }
    .parties { margin: 20px 0; }
    .clause { margin: 12px 0; text-align: justify; }
    .signature { margin-top: 40px; }
    .signature p { margin: 4px 0; }
  </style>
</head>
<body>
  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
  <p style="text-align: center;"><strong>${event.contract_number || "Contrato"}</strong></p>

  <div class="parties">
    <p><strong>CONTRATANTE:</strong> ${client?.name || "—"}, ${client?.cpf ? "CPF " + client.cpf : ""}, ${[client?.address, client?.city].filter(Boolean).join(", ") || ""}, ${client?.phone ? "Tel. " + client.phone : ""}, ${client?.email ? "Email: " + client.email : ""}.</p>
    <p><strong>CONTRATADA:</strong> ${profile?.company_name || "Empresa"}, ${profile?.cnpj ? "CNPJ " + profile.cnpj : ""}, ${profile?.address || ""}, ${profile?.phone ? "Tel. " + profile.phone : ""}, ${profile?.email || ""}.</p>
  </div>

  <h2>CLÁUSULA 1 – OBJETO</h2>
  <p class="clause">O presente contrato tem por objeto a prestação de serviços de buffet (fondue de frutas com chocolate) para evento a ser realizado em ${dateStr}, às ${timeStr}, no endereço ${[event.event_address, event.event_city].filter(Boolean).join(", ") || "a definir"}, para ${event.guests_count} (convidados).</p>

  <h2>CLÁUSULA 2 – VALOR E FORMA DE PAGAMENTO</h2>
  <p class="clause">O valor total do serviço é de R$ ${(event.sale_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (valor por pessoa: R$ ${(event.price_per_person ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}). O pagamento será efetuado da seguinte forma: entrada de R$ ${(event.payment_entry ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} e o restante de R$ ${(event.payment_rest ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} até ${event.payment_rest_date ? format(event.payment_rest_date, "dd/MM/yyyy", { locale: ptBR }) : "o dia do evento"}.</p>

  <h2>CLÁUSULA 3 – OBRIGAÇÕES DA CONTRATADA</h2>
  <p class="clause">São obrigações da CONTRATADA: fornecer o serviço de buffet conforme combinado, no local e data acordados, com a quantidade de convidados informada.</p>

  <h2>CLÁUSULA 4 – OBRIGAÇÕES DO CONTRATANTE</h2>
  <p class="clause">São obrigações do CONTRATANTE: fornecer o local em condições adequadas, efetuar os pagamentos nas datas combinadas e informar com antecedência qualquer alteração no número de convidados ou data.</p>

  <h2>CLÁUSULA 5 – CANCELAMENTO</h2>
  <p class="clause">Em caso de cancelamento pelo CONTRATANTE, será exigido aviso prévio mínimo de 7 (sete) dias. O valor da entrada (sinal) não será devolvido em caso de cancelamento.</p>

  <h2>CLÁUSULA 6 – RESCISÃO</h2>
  <p class="clause">O presente contrato poderá ser rescindido por qualquer das partes, nas condições da cláusula anterior, ou por inadimplemento.</p>

  <h2>CLÁUSULA 7 – FORO</h2>
  <p class="clause">Fica eleito o foro da ${forum} para dirimir quaisquer dúvidas oriundas do presente contrato.</p>

  <div class="signature">
    <p>_________________________________________</p>
    <p>CONTRATANTE</p>
    <p>Data: _____/_____/_____ Local: _________________</p>
    <p style="margin-top: 24px;">_________________________________________</p>
    <p>CONTRATADA</p>
    <p>Data: _____/_____/_____ Local: _________________</p>
  </div>
</body>
</html>
`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="contrato-${event.contract_number || eventId}.html"`,
    },
  });
}
