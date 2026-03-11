import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EventStatus } from "@/types/database";

const VALID_STATUSES: EventStatus[] = ["orcamento", "contrato_gerado", "realizado", "cancelado"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: event } = await supabase.from("events").select("id, user_id").eq("id", id).single();
  if (!event || event.user_id !== user.id) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }
  const status = body.status;
  if (!status || !VALID_STATUSES.includes(status as EventStatus)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const { error } = await supabase
    .from("events")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: event } = await supabase.from("events").select("id, user_id").eq("id", id).single();
  if (!event || event.user_id !== user.id) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  await supabase.from("event_items").delete().eq("event_id", id);
  await supabase.from("contracts").delete().eq("event_id", id);
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
