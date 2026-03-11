import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      clients(name, phone, email, address, city),
      event_items(ingredient_name, quantity_kg, unit_price, total_price)
    `)
    .eq("id", id)
    .single();

  if (!event) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const client = event.clients as { name: string; phone: string | null; email: string | null; address: string | null; city: string | null } | null;
  const items = (event.event_items || []) as { ingredient_name: string; quantity_kg: number; unit_price: number; total_price: number }[];

  const dateStr = event.event_date ? format(event.event_date, "dd/MM/yyyy", { locale: ptBR }) : "—";
  const timeStr = event.event_time ? String(event.event_time).slice(0, 5) : "—";
  const validityDate = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "dd/MM/yyyy", { locale: ptBR });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Orçamento ${event.budget_number || id}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; font-size: 12px; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #ff6b2b; }
    .company h1 { margin: 0; font-size: 18px; color: #ff6b2b; }
    .company p { margin: 4px 0 0; color: #555; }
    .budget-number { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f5f5f5; font-weight: 600; }
    .total { font-size: 18px; font-weight: 700; color: #ff6b2b; margin: 16px 0; }
    .section { margin: 20px 0; }
    .section h2 { font-size: 14px; margin: 0 0 8px; color: #333; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
    .pix { background: #f0fff0; padding: 8px 12px; border-radius: 4px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>${profile?.company_name || "ChocoNick Buffet"}</h1>
      <p>${profile?.owner_name || ""} ${profile?.phone ? " · " + profile.phone : ""}</p>
      <p>${profile?.email || ""}</p>
      ${profile?.address ? "<p>" + profile.address + "</p>" : ""}
    </div>
    <div class="budget-number">${event.budget_number || "Orçamento"}</div>
  </div>

  <div class="section">
    <h2>Cliente</h2>
    <p><strong>${client?.name || "—"}</strong></p>
    ${client?.phone ? "<p>Tel: " + client.phone + "</p>" : ""}
    ${client?.email ? "<p>Email: " + client.email + "</p>" : ""}
    ${client?.address || client?.city ? "<p>" + [client?.address, client?.city].filter(Boolean).join(", ") + "</p>" : ""}
  </div>

  <div class="section">
    <h2>Evento</h2>
    <p><strong>Data:</strong> ${dateStr} &nbsp; <strong>Horário:</strong> ${timeStr}</p>
    <p><strong>Local:</strong> ${[event.event_address, event.event_city].filter(Boolean).join(", ") || "—"}</p>
    <p><strong>Nº de convidados:</strong> ${event.guests_count}</p>
  </div>

  <div class="section">
    <h2>Serviços incluídos</h2>
    <table>
      <thead>
        <tr><th>Descrição</th><th>Qtd</th><th>Valor un.</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${items.map((i) => `
        <tr>
          <td>${i.ingredient_name}</td>
          <td>${i.quantity_kg}</td>
          <td>R$ ${(i.unit_price ?? 0).toFixed(2)}</td>
          <td>R$ ${(i.total_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
        </tr>
        `).join("")}
      </tbody>
    </table>
    <p class="total">Valor total: R$ ${(event.sale_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
    <p>Valor por pessoa: R$ ${(event.price_per_person ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
  </div>

  <div class="section">
    <h2>Condições de pagamento</h2>
    <p>Entrada: R$ ${(event.payment_entry ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
    <p>Restante: R$ ${(event.payment_rest ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (até ${event.payment_rest_date ? format(event.payment_rest_date, "dd/MM/yyyy", { locale: ptBR }) : "dia do evento"})</p>
    ${profile?.pix_key ? `<div class="pix"><strong>Chave PIX:</strong> ${profile.pix_key}</div>` : ""}
  </div>

  <div class="footer">
    <p>Orçamento válido até ${validityDate}. Contato: ${profile?.phone || ""} ${profile?.email || ""}</p>
  </div>
</body>
</html>
`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="orcamento-${event.budget_number || id}.html"`,
    },
  });
}
