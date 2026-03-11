"use client";

import { MessageCircle } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  copySuccessMessage?: string;
  showWhatsAppButton?: boolean;
  extraButtons?: React.ReactNode;
};

export function TextModal({
  open,
  onClose,
  title,
  text,
  copySuccessMessage = "Texto copiado!",
  showWhatsAppButton = false,
  extraButtons,
}: Props) {
  if (!open) return null;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      const { toast } = await import("sonner");
      toast.success(copySuccessMessage);
    } catch {
      const { toast } = await import("sonner");
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground p-1 text-xl leading-none"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1">
          <textarea
            readOnly
            value={text}
            className="w-full h-64 p-3 text-sm font-mono text-foreground bg-background border border-border rounded-lg resize-none select-all"
          />
        </div>
        <div className="p-4 border-t border-border flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 flex-1 min-w-[120px] py-2.5 rounded-lg font-medium hover:opacity-90"
            style={{ backgroundColor: "#5C3317", color: "#F5E6D3" }}
          >
            Copiar Texto
          </button>
          {extraButtons}
          {showWhatsAppButton && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 flex-1 min-w-[120px] py-2.5 rounded-lg text-white font-medium hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="w-4 h-4" />
              Enviar por WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-medium hover:opacity-90"
            style={{ backgroundColor: "#C4A882", color: "#1a1a1a" }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
