import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Pencil } from "lucide-react";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  const { data: events } = await supabase
    .from("events")
    .select("id, event_date, guests_count, sale_price, status, budget_number")
    .eq("client_id", id)
    .order("event_date", { ascending: false });

  const totalSpent = (events || []).reduce((s, e) => s + (e.sale_price ?? 0), 0);
  const lastEvent = events && events.length > 0 ? events[0] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/clients"
          className="p-2 rounded-lg border border-border text-foreground hover:bg-surface"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <p className="text-foreground/70 text-sm">Perfil do cliente</p>
        </div>
        <Link
          href={`/clients/${id}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Total gasto</p>
          <p className="font-mono text-xl text-foreground">
            R$ {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Eventos</p>
          <p className="font-mono text-xl text-foreground">{events?.length ?? 0}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-foreground/70">Último evento</p>
          <p className="font-mono text-foreground">
            {lastEvent?.event_date
              ? format(lastEvent.event_date, "dd/MM/yyyy", { locale: ptBR })
              : "—"}
          </p>
        </div>
      </div>

      {client.notes && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h2 className="text-sm font-medium text-foreground/70 mb-2">Observações</h2>
          <p className="text-foreground text-sm whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <h2 className="p-4 text-lg font-semibold text-foreground border-b border-border">
          Histórico de eventos
        </h2>
        {!events || events.length === 0 ? (
          <p className="p-4 text-foreground/70 text-sm">Nenhum evento ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((evt: { id: string; event_date: string | null; guests_count: number; sale_price: number | null; status: string; budget_number: string | null }) => (
              <li key={evt.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/budget/${evt.id}`} className="font-medium text-accent hover:underline">
                    {evt.budget_number || evt.id.slice(0, 8)}
                  </Link>
                  <span className="text-foreground/70 text-sm ml-2">
                    {evt.event_date ? format(evt.event_date, "dd/MM/yyyy", { locale: ptBR }) : ""} · {evt.guests_count} conv.
                  </span>
                </div>
                <span className="font-mono text-foreground">
                  R$ {(evt.sale_price ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-foreground/10 text-foreground">
                  {evt.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
