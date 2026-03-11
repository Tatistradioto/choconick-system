"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  UtensilsCrossed,
  DollarSign,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Orçamento", icon: FileText },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/ingredients", label: "Ingredientes", icon: UtensilsCrossed },
  { href: "/financial", label: "Financeiro", icon: DollarSign },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase não configurado ou erro de rede; redireciona mesmo assim
    }
    window.location.href = "/";
  }

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-border text-foreground shadow-card"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`
          w-64 bg-white border-r border-border flex flex-col fixed inset-y-0 z-40 shadow-card
          transform transition-transform md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <Link href="/dashboard" className="font-semibold text-accent" onClick={() => setOpen(false)}>
            ChocoNick
          </Link>
          <button
            type="button"
            className="md:hidden p-1 text-foreground/60 hover:text-foreground"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${isActive ? "bg-accent/10 text-accent" : "text-foreground/80 hover:bg-background"}
                `}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/70 hover:bg-background hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </aside>
      <div className="w-64 shrink-0 hidden md:block" aria-hidden />
    </>
  );
}
