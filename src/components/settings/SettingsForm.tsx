"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  cnpj: string | null;
  logo_url: string | null;
  pix_key: string | null;
  contract_template?: string | null;
} | null;

type Settings = {
  id: string;
  price_per_km: number;
  default_profit_margin: number;
  whatsapp_template: string | null;
  email_template: string | null;
  contract_forum: string | null;
} | null;

import { CONTRACT_VARIABLES_INFO, DEFAULT_CONTRACT_TEMPLATE } from "@/lib/contractTemplate";

export function SettingsForm({ profile, settings }: { profile: Profile; settings: Settings }) {
  const [companyName, setCompanyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pricePerKm, setPricePerKm] = useState("2.5");
  const [defaultMargin, setDefaultMargin] = useState("35");
  const [contractForum, setContractForum] = useState("");
  const [contractTemplate, setContractTemplate] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name ?? "");
      setOwnerName(profile.owner_name ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setCnpj(profile.cnpj ?? "");
      setPixKey(profile.pix_key ?? "");
      setContractTemplate(profile.contract_template ?? DEFAULT_CONTRACT_TEMPLATE);
    }
    if (settings) {
      setPricePerKm(String(settings.price_per_km ?? 2.5));
      setDefaultMargin(String(settings.default_profit_margin ?? 35));
      setContractForum(settings.contract_forum ?? "");
    }
  }, [profile, settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Não autorizado");
      setLoading(false);
      return;
    }
    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        company_name: companyName || null,
        owner_name: ownerName || null,
        phone: phone || null,
        address: address || null,
        cnpj: cnpj || null,
        pix_key: pixKey || null,
      })
      .eq("id", user.id);
    if (profileErr) {
      toast.error(profileErr.message);
      setLoading(false);
      return;
    }
    const { error: setErr } = await supabase
      .from("settings")
      .update({
        price_per_km: parseFloat(pricePerKm) || 2.5,
        default_profit_margin: parseFloat(defaultMargin) || 35,
        contract_forum: contractForum || null,
      })
      .eq("user_id", user.id);
    if (setErr) {
      toast.error(setErr.message);
      setLoading(false);
      return;
    }
    toast.success("Configurações salvas.");
    setLoading(false);
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Não autorizado");
      setSavingTemplate(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ contract_template: contractTemplate || null })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      setSavingTemplate(false);
      return;
    }
    toast.success("Template de contrato salvo.");
    setSavingTemplate(false);
  }

  async function handleRestoreDefaultTemplate() {
    setContractTemplate(DEFAULT_CONTRACT_TEMPLATE);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ contract_template: DEFAULT_CONTRACT_TEMPLATE })
      .eq("id", user.id);
    toast.success("Template de contrato restaurado.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Dados da empresa</h2>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Nome da empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Seu nome</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Telefone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Endereço</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">CNPJ</label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Chave PIX</label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="CPF, email, telefone ou chave aleatória"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Orçamentos e contrato</h2>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Preço por km (R$)</label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={pricePerKm}
            onChange={(e) => setPricePerKm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Margem de lucro padrão (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={defaultMargin}
            onChange={(e) => setDefaultMargin(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/90 mb-1">Foro do contrato</label>
          <input
            type="text"
            value={contractForum}
            onChange={(e) => setContractForum(e.target.value)}
            placeholder="Ex: comarca de São Paulo"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Template do contrato</h2>
            <p className="text-foreground/70 text-sm mt-0.5">
              Edite o texto completo do contrato usando variáveis entre chaves, por exemplo {"{{nomeCliente}}"}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestoreDefaultTemplate}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50"
            >
              Restaurar padrão
            </button>
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={savingTemplate}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {savingTemplate ? "Salvando…" : "Salvar template"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">
              Texto do contrato (usa variáveis {"{{variavel}}"})
            </label>
            <textarea
              value={contractTemplate}
              onChange={(e) => setContractTemplate(e.target.value)}
              className="w-full min-h-[320px] px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm font-mono whitespace-pre-wrap"
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-foreground/90 mb-2">Variáveis disponíveis</p>
            <div className="border border-border rounded-lg bg-background/60 max-h-[360px] overflow-y-auto text-sm">
              <ul className="divide-y divide-border">
                {CONTRACT_VARIABLES_INFO?.map((v) => (
                  <li key={v.key} className="px-3 py-2">
                    <p className="font-mono text-xs text-accent mb-0.5">{"{{" + v.key + "}}"}</p>
                    <p className="text-foreground/80 text-xs">{v.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Salvando…" : "Salvar configurações"}
      </button>
    </form>
  );
}
