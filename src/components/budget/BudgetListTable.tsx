"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Pencil, Trash2 } from "lucide-react";

type EventRow = {
  id: string;
  budget_number: string | null;
  clients: { name: string } | null;
  event_date: string | null;
  created_at: string | null;
  guests_count: number;
  sale_price: number | null;
  status: string;
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    orcamento: { label: "Orçamento", className: "bg-amber-500/20 text-amber-600" },
    contrato_gerado: { label: "Contrato Gerado 📋", className: "bg-blue-500/20 text-blue-600" },
    realizado: { label: "Realizado ⭐", className: "bg-green-500/20 text-green-600" },
    cancelado: { label: "Cancelado", className: "bg-red-500/20 text-red-600" },
  };
  const { label, className } = config[status] ?? { label: status, className: "bg-zinc-500/20 text-zinc-600" };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

const NEXT_STATUS_LABEL: Record<string, string> = {
  contrato_gerado: "Contrato Gerado 📋",
  realizado: "Realizado ⭐",
};

export function BudgetListTable({ events }: { events: EventRow[] }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusChange, setStatusChange] = useState<{ id: string; nextStatus: string } | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao excluir");
      }
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmStatusChange() {
    if (!statusChange) return;
    setStatusChanging(true);
    try {
      const res = await fetch(`/api/events/${statusChange.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusChange.nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao atualizar status");
      }
      setStatusChange(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao atualizar status");
    } finally {
      setStatusChanging(false);
    }
  }

  const eventToDelete = deleteId ? events.find((e) => e.id === deleteId) : null;
  const numeroToDelete = eventToDelete?.budget_number ?? deleteId;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground/70">
              <th className="p-3 font-medium">Nº / Cliente</th>
              <th className="p-3 font-medium">Data</th>
              <th className="p-3 font-medium">Convidados</th>
              <th className="p-3 font-medium">Valor</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt) => (
              <tr key={evt.id} className="border-b border-border hover:bg-background/50">
                <td className="p-3">
                  <span className="font-mono text-foreground/70">{evt.budget_number || "—"}</span>
                  <br />
                  <span className={evt.clients?.name ? "text-foreground" : "text-foreground/50"}>
                    {evt.clients?.name || "Sem cliente"}
                  </span>
                </td>
                <td className="p-3 text-foreground/90">
                  {(() => {
                    const dateVal = evt.event_date ?? evt.created_at;
                    if (!dateVal) return <span className="text-foreground/50">Sem data</span>;
                    try {
                      const d = new Date(dateVal);
                      if (Number.isNaN(d.getTime())) return <span className="text-foreground/50">Sem data</span>;
                      return format(d, "dd/MM/yyyy", { locale: ptBR });
                    } catch {
                      return <span className="text-foreground/50">Sem data</span>;
                    }
                  })()}
                </td>
                <td className="p-3 font-mono">{evt.guests_count}</td>
                <td className="p-3 font-mono">
                  R$ {(evt.sale_price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={evt.status} />
                    {evt.status === "orcamento" && (
                      <button
                        type="button"
                        onClick={() => setStatusChange({ id: evt.id, nextStatus: "contrato_gerado" })}
                        className="text-xs px-2 py-1 rounded border border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                      >
                        📋 Gerar Contrato
                      </button>
                    )}
                    {evt.status === "contrato_gerado" && (
                      <button
                        type="button"
                        onClick={() => setStatusChange({ id: evt.id, nextStatus: "realizado" })}
                        className="text-xs px-2 py-1 rounded border border-green-500/50 text-green-600 hover:bg-green-500/10"
                      >
                        ⭐ Marcar Realizado
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/budget/${evt.id}/edit`}
                      className="p-1.5 rounded text-accent hover:bg-accent/10"
                      title="Ver"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/budget/${evt.id}/edit`}
                      className="p-1.5 rounded text-foreground hover:bg-foreground/10"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteId(evt.id)}
                      className="p-1.5 rounded text-red-600 hover:bg-red-500/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !deleting && setDeleteId(null)}
        >
          <div
            className="bg-surface border border-border rounded-xl shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-foreground mb-4">
              Tem certeza que deseja excluir o orçamento <strong>{numeroToDelete}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !deleting && setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !statusChanging && setStatusChange(null)}
        >
          <div
            className="bg-surface border border-border rounded-xl shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-foreground mb-4">
              Confirmar mudança de status para <strong>{NEXT_STATUS_LABEL[statusChange.nextStatus] ?? statusChange.nextStatus}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !statusChanging && setStatusChange(null)}
                disabled={statusChanging}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={statusChanging}
                className="px-4 py-2 rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-50"
              >
                {statusChanging ? "Salvando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
