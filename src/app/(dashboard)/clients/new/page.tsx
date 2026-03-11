import { ClientForm } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">Novo cliente</h1>
      <p className="text-foreground/70 text-sm mb-6">Preencha os dados do cliente</p>
      <ClientForm />
    </div>
  );
}
