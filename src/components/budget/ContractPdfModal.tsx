"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateContractPdf, type ContractPdfData, type ContractCalculatorSnapshot } from "@/lib/generateContractPdf";
import { DEFAULT_CONTRACT_TEMPLATE, substituirVariaveis, type ContratoData } from "@/lib/contractTemplate";

/** Garante que o snapshot tenha opcionais no formato { id, name, active }[] para o contrato */
function normalizeCalculatorSnapshot(snap: unknown): ContractCalculatorSnapshot | null {
  if (!snap || typeof snap !== "object") return null;
  const s = snap as Record<string, unknown>;
  const opcionais = Array.isArray(s.opcionais)
    ? (s.opcionais as unknown[])
        .map((o: unknown) => {
          if (!o || typeof o !== "object") return null;
          const oo = o as Record<string, unknown>;
          return {
            id: String(oo.id ?? ""),
            name: String(oo.name ?? ""),
            active: Boolean(oo.active),
          };
        })
        .filter((x): x is { id: string; name: string; active: boolean } => x !== null && x.id !== "")
    : [];
  return { ...s, opcionais } as ContractCalculatorSnapshot;
}
import { toast } from "sonner";
import { Search } from "lucide-react";

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export type ContractModalPrefill = {
  nomeCliente?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cpfCnpj?: string;
  dataEvento?: string;
  horarioEvento?: string;
  localEvento?: string;
  convidados?: number;
  valorTotal?: number;
  valorEntrada?: number;
  valorRestante?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string | null;
  prefill?: ContractModalPrefill;
  onSuccess?: () => void;
  onClientSaved?: (clientName: string) => void;
};

type ClientSearchHit = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  cpf: string | null;
  cpf_cnpj: string | null;
};

export function ContractPdfModal({ open, onClose, eventId, prefill, onSuccess, onClientSaved }: Props) {
  const [nomeCliente, setNomeCliente] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horarioEvento, setHorarioEvento] = useState("");
  const [localEvento, setLocalEvento] = useState("");
  const [convidados, setConvidados] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [valorRestante, setValorRestante] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(false);

  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<ClientSearchHit[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [calculatorSnapshot, setCalculatorSnapshot] = useState<ContractCalculatorSnapshot | null>(null);
  const [contractTemplate, setContractTemplate] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [numeroOrcamento, setNumeroOrcamento] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "preview">("form");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setClientSearchQuery("");
    setClientSearchResults([]);
    setSelectedClientId(null);
    setShowSearchDropdown(false);
    setCalculatorSnapshot(null);
    setNomeCliente(prefill?.nomeCliente ?? "");
    setCpfCnpj(formatCpfCnpj(prefill?.cpfCnpj ?? ""));
    setEndereco(prefill?.endereco ?? "");
    setTelefone(prefill?.telefone ?? "");
    setEmail(prefill?.email ?? "");
    setDataEvento(prefill?.dataEvento ?? "");
    setHorarioEvento(prefill?.horarioEvento ?? "");
    setLocalEvento(prefill?.localEvento ?? "");
    setConvidados(prefill?.convidados ?? 0);
    setValorTotal(prefill?.valorTotal ?? 0);
    setValorEntrada(prefill?.valorEntrada ?? 0);
    setValorRestante(prefill?.valorRestante ?? 0);
    setPreviewText("");
    setContractTemplate(null);
    setNumeroOrcamento(null);

    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("contract_template")
            .eq("id", user.id)
            .single();
          setContractTemplate(profile?.contract_template ?? DEFAULT_CONTRACT_TEMPLATE);
        } else {
          setContractTemplate(DEFAULT_CONTRACT_TEMPLATE);
        }
      } catch {
        setContractTemplate(DEFAULT_CONTRACT_TEMPLATE);
      }
    })();
    if (eventId) {
      setLoadingPrefill(true);
      (async () => {
        try {
          const supabase = createClient();
          const { data: event } = await supabase.from("events").select("*").eq("id", eventId).single();
          if (event) {
            setConvidados(event.guests_count ?? 0);
            setValorTotal(Number(event.sale_price) ?? 0);
            const ent = Number(event.payment_entry) ?? 0;
            const rest = Number(event.payment_rest) ?? 0;
            setValorEntrada(ent);
            setValorRestante(rest);
            setDataEvento(event.event_date ? String(event.event_date).slice(0, 10) : "");
            setHorarioEvento(event.event_time ? String(event.event_time).slice(0, 5) : "");
            setLocalEvento([event.event_address, event.event_city].filter(Boolean).join(", ") || "");
            setNumeroOrcamento(event.budget_number ?? null);
            const rawSnap = (event as { calculator_snapshot?: unknown }).calculator_snapshot;
            setCalculatorSnapshot(normalizeCalculatorSnapshot(rawSnap));
            if (event.client_id) {
              setSelectedClientId(event.client_id);
              const { data: client } = await supabase.from("clients").select("name, phone, email, address, city, cpf, cpf_cnpj").eq("id", event.client_id).single();
              if (client) {
                setNomeCliente(client.name ?? "");
                setTelefone(client.phone ?? "");
                setEmail(client.email ?? "");
                setCpfCnpj(formatCpfCnpj((client as { cpf_cnpj?: string | null }).cpf_cnpj ?? client.cpf ?? ""));
                const addr = [client.address, client.city].filter(Boolean).join(", ");
                setEndereco(addr || "");
              }
            }
          }
        } catch {
          // keep prefill from props
        } finally {
          setLoadingPrefill(false);
        }
      })();
    }
  }, [open, eventId, prefill?.nomeCliente, prefill?.telefone, prefill?.email, prefill?.endereco, prefill?.cpfCnpj, prefill?.dataEvento, prefill?.horarioEvento, prefill?.localEvento, prefill?.convidados, prefill?.valorTotal, prefill?.valorEntrada, prefill?.valorRestante]);

  useEffect(() => {
    if (!open || !contractTemplate) return;
    const dados: ContratoData = {
      nomeCliente: nomeCliente.trim(),
      cpfCliente: cpfCnpj.trim(),
      enderecoCliente: endereco.trim(),
      telefoneCliente: telefone.trim(),
      email: email.trim(),
      dataEvento: dataEvento || new Date().toISOString().slice(0, 10),
      horarioEvento: horarioEvento.trim() || "00:00",
      localEvento: localEvento.trim(),
      convidados: convidados || 0,
      valorTotal,
      valorEntrada: valorEntrada || 0,
      valorRestante: valorRestante || 0,
      numeroOrcamento,
      calculatorSnapshot: calculatorSnapshot ?? null,
    };
    setPreviewLoading(true);
    try {
      const texto = substituirVariaveis(contractTemplate, dados);
      setPreviewText(texto);
    } catch {
      // ignore
    } finally {
      setPreviewLoading(false);
    }
  }, [
    open,
    contractTemplate,
    nomeCliente,
    cpfCnpj,
    endereco,
    telefone,
    email,
    dataEvento,
    horarioEvento,
    localEvento,
    convidados,
    valorTotal,
    valorEntrada,
    valorRestante,
    numeroOrcamento,
    calculatorSnapshot,
  ]);

  useEffect(() => {
    if (clientSearchQuery.trim().length < 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setClientSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const supabase = createClient();
        const q = clientSearchQuery.trim();
        const { data } = await supabase
          .from("clients")
          .select("id, name, phone, email, address, city, cpf, cpf_cnpj")
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(10);
        setClientSearchResults((data ?? []) as ClientSearchHit[]);
        setShowSearchDropdown(true);
      } catch {
        setClientSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [clientSearchQuery]);

  useEffect(() => {
    if (!showSearchDropdown) return;
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [showSearchDropdown]);

  const handleSelectClient = (c: ClientSearchHit) => {
    setNomeCliente(c.name ?? "");
    setCpfCnpj(formatCpfCnpj(c.cpf_cnpj ?? c.cpf ?? ""));
    setEndereco([c.address, c.city].filter(Boolean).join(", ") || "");
    setTelefone(c.phone ?? "");
    setEmail(c.email ?? "");
    setSelectedClientId(c.id);
    setClientSearchQuery("");
    setClientSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleSaveClient = async () => {
    const nome = nomeCliente.trim();
    const cpf = cpfCnpj.trim();
    const end = endereco.trim();
    const tel = telefone.trim();
    if (!nome) {
      toast.error("Preencha o nome do cliente.");
      return;
    }
    setSavingClient(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar.");
        setSavingClient(false);
        return;
      }
      let clientId: string | null = null;

      const clientPayload = {
        name: nome,
        phone: tel || null,
        email: email.trim() || null,
        cpf_cnpj: cpf || null,
        address: end || null,
        city: null as string | null,
      };

      if (selectedClientId) {
        await supabase.from("clients").update(clientPayload).eq("id", selectedClientId);
        clientId = selectedClientId;
      } else {
        if (eventId) {
          const { data: event } = await supabase.from("events").select("client_id").eq("id", eventId).single();
          if (event?.client_id) {
            await supabase.from("clients").update(clientPayload).eq("id", event.client_id);
            clientId = event.client_id;
          }
        }
        if (!clientId && cpf) {
          const { data: byCpfCnpj } = await supabase
            .from("clients")
            .select("id")
            .eq("user_id", user.id)
            .eq("cpf_cnpj", cpf)
            .maybeSingle();
          const { data: byCpf } = !byCpfCnpj?.id
            ? await supabase.from("clients").select("id").eq("user_id", user.id).eq("cpf", cpf).maybeSingle()
            : { data: null };
          const existing = byCpfCnpj ?? byCpf;
          if (existing?.id) {
            await supabase.from("clients").update(clientPayload).eq("id", existing.id);
            clientId = existing.id;
          }
        }
        if (!clientId) {
          const { data: inserted } = await supabase
            .from("clients")
            .insert({
              user_id: user.id,
              ...clientPayload,
            })
            .select("id")
            .single();
          clientId = inserted?.id ?? null;
        }
      }

      if (eventId) {
        const eventPayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
          event_date: dataEvento || null,
          event_time: horarioEvento || null,
          event_address: localEvento.trim() || null,
        };
        if (clientId) eventPayload.client_id = clientId;
        await supabase.from("events").update(eventPayload).eq("id", eventId);
      }
      toast.success(eventId && clientId ? "Cliente salvo e vinculado ao orçamento!" : "Cliente salvo!");
      onClientSaved?.(nome);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setSavingClient(false);
    }
  };

  const handleShowPreview = () => {
    const nome = nomeCliente.trim();
    const cpf = cpfCnpj.replace(/\D/g, "").trim();
    const end = endereco.trim();
    const tel = telefone.trim();
    if (!nome || !cpf || !end || !tel) {
      toast.error("Preencha Nome, CPF/CNPJ, Endereço e Telefone.");
      return;
    }
    setStep("preview");
  };

  const handleGenerate = async () => {
    const nome = nomeCliente.trim();
    const cpf = cpfCnpj.replace(/\D/g, "").trim();
    const end = endereco.trim();
    const tel = telefone.trim();
    if (!nome || !cpf || !end || !tel) {
      toast.error("Preencha Nome, CPF/CNPJ, Endereço e Telefone.");
      return;
    }
    setLoading(true);
    try {
      const data: ContractPdfData = {
        nomeCliente: nome,
        cpfCnpj: cpfCnpj.trim(),
        enderecoCliente: end,
        telefone: tel,
        email: email.trim(),
        dataEvento: dataEvento || new Date().toISOString().slice(0, 10),
        horarioEvento: horarioEvento.trim(),
        localEvento: localEvento.trim(),
        convidados: convidados || 0,
        valorTotal,
        valorEntrada: valorEntrada || valorTotal * 0.3,
        valorRestante: valorRestante || valorTotal * 0.7,
        calculatorSnapshot: calculatorSnapshot ?? undefined,
        contratoTexto: previewText || null,
      };
      generateContractPdf(data);
      if (eventId) {
        const supabase = createClient();
        await supabase.from("events").update({ status: "contrato_gerado", updated_at: new Date().toISOString() }).eq("id", eventId);
      }
      toast.success("Contrato gerado e baixado.");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar contrato.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface border border-border rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {step === "form" ? "Dados do cliente — Gerar Contrato PDF" : "Preview do contrato"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-muted/50"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {step === "form" ? (
          <div className="p-5 space-y-3">
            {loadingPrefill && (
              <p className="text-sm text-foreground/60">Carregando dados do orçamento…</p>
            )}

            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-medium text-foreground/90 mb-1">Buscar cliente cadastrado</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 pointer-events-none" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  onFocus={() => clientSearchQuery.trim().length >= 2 && clientSearchResults.length > 0 && setShowSearchDropdown(true)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  placeholder="Buscar cliente cadastrado..."
                />
              </div>
              {showSearchDropdown && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <li className="px-3 py-2 text-sm text-foreground/60">Buscando…</li>
                  ) : clientSearchResults.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-foreground/60">Nenhum cliente encontrado</li>
                  ) : (
                    clientSearchResults.map((c) => (
                      <li
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectClient(c)}
                        onKeyDown={(e) => e.key === "Enter" && handleSelectClient(c)}
                        className="px-3 py-2 text-sm text-foreground hover:bg-muted/50 cursor-pointer border-b border-border last:border-0"
                      >
                        <span className="font-medium">{c.name ?? "—"}</span>
                        {c.phone ? <span className="text-foreground/70 ml-2">{c.phone}</span> : null}
                      </li>
                    ))
                  )}
                </ul>
              )}
              {selectedClientId && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
                  Cliente encontrado ✓
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-foreground/60 whitespace-nowrap">ou cadastrar novo cliente</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">Nome completo *</label>
              <input
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">CPF/CNPJ *</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">Endereço completo *</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">Telefone *</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="(62) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Data do evento</label>
                <input
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Horário do evento</label>
                <input
                  type="time"
                  value={horarioEvento}
                  onChange={(e) => setHorarioEvento(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-1">Local do evento (espaço/salão)</label>
              <input
                type="text"
                value={localEvento}
                onChange={(e) => setLocalEvento(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                placeholder="Nome do salão ou endereço"
              />
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground/90 mb-1">Preview do contrato</p>
                <p className="text-xs text-foreground/60">
                  Revise o texto abaixo, faça ajustes finais se necessário e clique em &quot;Baixar PDF&quot; para gerar o arquivo.
                </p>
              </div>
              {previewLoading && (
                <span className="text-xs text-foreground/60">Atualizando preview…</span>
              )}
            </div>
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full min-h-[360px] px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono whitespace-pre-wrap"
            />
          </div>
        )}
        <div className="p-5 flex gap-2 justify-end border-t border-border flex-wrap">
          {step === "form" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                disabled={savingClient}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#ff6b2b" }}
              >
                {savingClient ? "Salvando…" : "Salvar Cliente"}
              </button>
              <button
                type="button"
                onClick={handleShowPreview}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#5C3317" }}
              >
                {loading ? "Gerando…" : "Gerar Contrato PDF"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#5C3317" }}
              >
                {loading ? "Gerando…" : "Baixar PDF"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
