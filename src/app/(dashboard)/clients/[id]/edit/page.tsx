import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Editar cliente</h1>
      <p className="text-foreground/70 text-sm mb-6">{client.name}</p>
      <ClientForm client={client} />
    </div>
  );
}
