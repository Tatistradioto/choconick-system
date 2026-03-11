"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Email enviado! Verifique sua caixa de entrada.");
  }

  if (sent) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 shadow-card text-center">
        <p className="text-foreground mb-4">
          Enviamos um link para <strong>{email}</strong>. Acesse o link para redefinir sua senha.
        </p>
        <Link href="/login" className="text-accent hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      <h1 className="text-xl font-semibold text-foreground mb-1">Recuperar senha</h1>
      <p className="text-sm text-foreground/70 mb-6">Informe seu email para receber o link</p>
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
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Enviando…" : "Enviar link"}
        </button>
      </form>
      <p className="mt-4 text-center">
        <Link href="/login" className="text-sm text-accent hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
