"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Eye, Trash2 } from "lucide-react";

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  created_at: string;
};

export function ClientList({ initialClients }: { initialClients: ClientRow[] }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao excluir");
      }
      setClients((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  const clientToDelete = deleteId ? clients.find((c) => c.id === deleteId) : null;
  const nomeToDelete = clientToDelete?.name ?? deleteId;

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.replace(/\D/g, "").includes(search.replace(/\D/g, "")))
  );

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Buscar por nome, email ou telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-lg bg-surface border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-foreground/70">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum cliente encontrado.</p>
            <Link href="/clients/new" className="mt-2 inline-block text-accent hover:underline">
              Cadastrar primeiro cliente
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-foreground/70">
                  <th className="p-3 font-medium">Nome</th>
                  <th className="p-3 font-medium">Telefone</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">CPF/CNPJ</th>
                  <th className="p-3 font-medium">Endereço</th>
                  <th className="p-3 font-medium">Cidade</th>
                  <th className="p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border hover:bg-background/50">
                    <td className="p-3 font-medium text-foreground">{c.name}</td>
                    <td className="p-3 text-foreground/90">{c.phone || "—"}</td>
                    <td className="p-3 text-foreground/90">{c.email || "—"}</td>
                    <td className="p-3 text-foreground/90">{c.cpf_cnpj || "—"}</td>
                    <td className="p-3 text-foreground/90 max-w-[200px] truncate" title={c.address ?? undefined}>{c.address || "—"}</td>
                    <td className="p-3 text-foreground/90">{c.city || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clients/${c.id}`}
                          className="p-1.5 rounded text-accent hover:bg-accent/10"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteId(c.id)}
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
        )}
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
              Tem certeza que deseja excluir o cliente <strong>{nomeToDelete}</strong>? Esta ação não pode ser desfeita.
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
    </div>
  );
}
