"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Client } from "@/types/database";

type Props = {
  client?: Client | null;
};

export function ClientForm({ client }: Props) {
  const router = useRouter();
  const [name, setName] = useState(client?.name ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [cpf, setCpf] = useState(client?.cpf ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [city, setCity] = useState(client?.city ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Faça login para continuar");
      setLoading(false);
      return;
    }
    const payload = {
      user_id: user.id,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      cpf: cpf.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      notes: notes.trim() || null,
    };
    if (client) {
      const { error } = await supabase.from("clients").update(payload).eq("id", client.id);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Cliente atualizado.");
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Cliente cadastrado.");
    }
    router.push("/clients");
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">CPF</label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Endereço</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Cidade</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Observações</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Salvando…" : client ? "Atualizar" : "Cadastrar"}
        </button>
        <Link
          href="/clients"
          className="px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-background"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
