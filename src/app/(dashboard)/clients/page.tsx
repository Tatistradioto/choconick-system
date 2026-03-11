import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, User } from "lucide-react";
import { ClientList } from "@/components/clients/ClientList";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, email, city, cpf_cnpj, address, created_at")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-foreground/70 text-sm mt-0.5">CRM — cadastro e histórico</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          <Plus className="w-5 h-5" />
          Novo cliente
        </Link>
      </div>
      <ClientList initialClients={clients || []} />
    </div>
  );
}
