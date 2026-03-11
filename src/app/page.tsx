import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-accent mb-2">ChocoNick</h1>
        <p className="text-foreground/80 mb-8">Gestão de buffet de eventos</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-surface transition"
          >
            Cadastrar
          </Link>
        </div>
      </div>
    </div>
  );
}
