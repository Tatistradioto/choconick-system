"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { toast } from "sonner";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { supabase, error: configError } = useSupabaseClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: ownerName, company_name: companyName },
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      const user = data.user;
      if (user) {
        try {
          await supabase.from("profiles").update({
            company_name: companyName || null,
            owner_name: ownerName || null,
            email,
          }).eq("id", user.id);
        } catch {
          // profile pode ainda não existir por causa do trigger; não bloqueia
        }
      }
      setLoading(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        toast.success("Conta criada! Redirecionando…");
        window.location.href = "/dashboard";
      } else {
        toast.success("Conta criada! Verifique seu email para ativar e depois faça login.");
        router.push("/login?cadastro=ok");
      }
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
        toast.error("Não foi possível conectar. Verifique sua internet e o .env.local (URL e chave do Supabase).");
      } else {
        toast.error(msg);
      }
    }
  }

  if (configError) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <h1 className="text-xl font-semibold text-foreground mb-2">Configuração necessária</h1>
        <p className="text-sm text-foreground/80 mb-4">{configError}</p>
        <p className="text-xs text-foreground/60">
          Crie um projeto em <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-accent underline">supabase.com</a>, execute o SQL em <code className="bg-background px-1 rounded">supabase/schema.sql</code>, depois copie a URL e a anon key em Settings → API para o arquivo <code className="bg-background px-1 rounded">.env.local</code> na raiz do projeto.
        </p>
      </div>
    );
  }

  if (!supabase) {
    return <div className="bg-surface border border-border rounded-xl p-6 text-foreground/70">Carregando…</div>;
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      <h1 className="text-xl font-semibold text-foreground mb-1">Cadastrar</h1>
      <p className="text-sm text-foreground/70 mb-6">Dados da empresa</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Nome da empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="ChocoNick Buffet"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Seu nome</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="João Silva"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="contato@empresa.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Cadastrando…" : "Cadastrar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-foreground/70">
        Já tem conta?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
