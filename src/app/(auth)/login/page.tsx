"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { supabase, error: configError } = useSupabaseClient();

  useEffect(() => {
    if (searchParams.get("cadastro") === "ok") {
      toast.success("Cadastro feito! Faça login com seu email e senha.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Login realizado!");
      window.location.href = "/dashboard";
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
      <h1 className="text-xl font-semibold text-foreground mb-1">Entrar</h1>
      <p className="text-sm text-foreground/70 mb-6">Acesse sua conta</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground/90 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground/90 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Esqueci a senha
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-foreground/70">
        Não tem conta?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
