"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function BudgetDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Budget detail error:", error);
    console.error("Erro detalhado:", {
      message: error?.message,
      name: error?.name,
      cause: error?.cause,
      stack: error?.stack,
    });
  }, [error]);

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 text-red-500 mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Erro ao carregar orçamento</h1>
      <p className="text-foreground/70 text-sm mb-6">
        Não foi possível carregar os dados deste orçamento. Verifique sua conexão ou tente novamente.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90"
        >
          Tentar novamente
        </button>
        <Link
          href="/budget"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface text-foreground font-medium hover:bg-background"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos orçamentos
        </Link>
      </div>
    </div>
  );
}
