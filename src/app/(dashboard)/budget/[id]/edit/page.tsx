import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FullCalculator, { type EditInitialData } from "@/components/budget/FullCalculator";

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    console.error("Erro detalhado ao buscar orçamento (Supabase):", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    notFound();
  }

  let calculator_snapshot: any =
    (event as { calculator_snapshot?: unknown }).calculator_snapshot ?? null;
  if (typeof calculator_snapshot === "string") {
    try {
      calculator_snapshot = JSON.parse(calculator_snapshot) as EditInitialData["calculator_snapshot"];
    } catch {
      calculator_snapshot = null;
    }
  }
  if (calculator_snapshot && typeof calculator_snapshot !== "object") {
    calculator_snapshot = null;
  }

  const { data: client } = event.client_id
    ? await supabase.from("clients").select("id, name, phone").eq("id", event.client_id).single()
    : { data: null };
  const { data: eventItemsRows } = await supabase
    .from("event_items")
    .select("ingredient_name, quantity_kg, unit_price")
    .eq("event_id", id);
  const eventItems = (eventItemsRows ?? []).map((i) => ({
    ingredient_name: i.ingredient_name ?? null,
    quantity_kg: i.quantity_kg != null ? Number(i.quantity_kg) : null,
    unit_price: i.unit_price != null ? Number(i.unit_price) : null,
  }));

  const initialData: EditInitialData = {
    eventId: event.id,
    event: {
      guests_count: event.guests_count ?? 100,
      distance_km: Number(event.distance_km) ?? 30,
      profit_margin: Number(event.profit_margin) ?? 35,
      sale_price: event.sale_price != null ? Number(event.sale_price) : null,
      budget_number: event.budget_number ?? null,
      client_id: event.client_id ?? null,
      payment_entry: event.payment_entry != null ? Number(event.payment_entry) : null,
      payment_rest: event.payment_rest != null ? Number(event.payment_rest) : null,
    },
    eventItems,
    client: client ? { name: client.name, phone: client.phone } : null,
    calculator_snapshot,
  };

  return (
    <div className="max-w-full">
      <FullCalculator initialData={initialData} />
    </div>
  );
}
