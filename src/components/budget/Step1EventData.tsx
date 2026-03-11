"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WizardEventData } from "./BudgetWizard";
import type { Client } from "@/types/database";

type Props = {
  data: WizardEventData;
  onChange: (d: WizardEventData) => void;
  onNext: () => void;
  canProceed: boolean;
};

export function Step1EventData({ data, onChange, onNext, canProceed }: Props) {
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const supabase = createClient();

  const searchClients = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setClientResults([]);
        return;
      }
      setSearching(true);
      const { data: list } = await supabase
        .from("clients")
        .select("id, name, phone, email")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10);
      setClientResults(list || []);
      setSearching(false);
    },
    [supabase]
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Dados do evento</h2>

      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Cliente *</label>
        <input
          type="text"
          value={clientSearch || data.clientName}
          onChange={(e) => {
            setClientSearch(e.target.value);
            onChange({ ...data, clientName: e.target.value });
            searchClients(e.target.value);
          }}
          onBlur={() => setTimeout(() => setClientResults([]), 200)}
          placeholder="Nome, email ou telefone para buscar; ou digite um novo"
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {clientResults.length > 0 && (
          <ul className="mt-1 border border-border rounded-lg bg-background overflow-hidden">
            {clientResults.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-surface text-foreground text-sm"
                  onClick={() => {
                    onChange({
                      ...data,
                      clientId: c.id,
                      clientName: c.name,
                    });
                    setClientSearch("");
                    setClientResults([]);
                  }}
                >
                  {c.name} {c.phone ? ` · ${c.phone}` : ""}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Data do evento</label>
          <input
            type="date"
            value={data.eventDate}
            onChange={(e) => onChange({ ...data, eventDate: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Horário</label>
          <input
            type="time"
            value={data.eventTime}
            onChange={(e) => onChange({ ...data, eventTime: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Endereço do evento</label>
        <input
          type="text"
          value={data.eventAddress}
          onChange={(e) => onChange({ ...data, eventAddress: e.target.value })}
          placeholder="Rua, número, bairro"
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground/90 mb-1">Cidade</label>
        <input
          type="text"
          value={data.eventCity}
          onChange={(e) => onChange({ ...data, eventCity: e.target.value })}
          placeholder="Cidade"
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Distância (km)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={data.distanceKm || ""}
            onChange={(e) => onChange({ ...data, distanceKm: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Nº de convidados (10–500) *</label>
          <input
            type="number"
            min={10}
            max={500}
            value={data.guestsCount}
            onChange={(e) => onChange({ ...data, guestsCount: parseInt(e.target.value, 10) || 10 })}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            type="range"
            min={10}
            max={500}
            value={data.guestsCount}
            onChange={(e) => onChange({ ...data, guestsCount: parseInt(e.target.value, 10) })}
            className="w-full mt-1 accent-accent"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
