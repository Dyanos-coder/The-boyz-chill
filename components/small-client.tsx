"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";

/** Bouton d'envoi qui se bloque pendant l'envoi du formulaire. */
export function SubmitButton({
  children,
  pending: pendingLabel,
  className = "btn btn--primary btn--lg",
}: {
  children: ReactNode;
  pending?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

/** Copie un texte ; si le presse-papiers est refusé, sélectionne le champ à côté. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
    }
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor="invite-link">
        {label}
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} id="invite-link" className="input" readOnly value={value} onFocus={(e) => e.target.select()} />
        <button className="btn btn--outline btn--icon" style={{ ["--btn-h" as string]: "46px" }} type="button" onClick={copy} aria-label="Copier le lien">
          {copied ? <Check className="i" /> : <Copy className="i" />}
        </button>
      </div>
      <span className="field__hint" aria-live="polite">
        {copied ? "Lien copié. Envoie-le sur le groupe WhatsApp." : "Toute personne avec ce lien peut rejoindre le groupe."}
      </span>
    </div>
  );
}

/** Bouton qui demande une confirmation avant d'agir. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = "btn btn--danger",
}: {
  label: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
      <button
        type="button"
        className="btn btn--danger"
        disabled={pending}
        onClick={() => startTransition(async () => { await onConfirm(); setAsking(false); })}
      >
        {confirmLabel}
      </button>
      <button type="button" className="btn btn--ghost" onClick={() => setAsking(false)}>
        Garder
      </button>
    </span>
  );
}

/** Rafraîchit la page quand une réponse ou le plan change (temps réel Supabase). */
export function PlanLive({ planId }: { planId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };
    const channel = supabase
      .channel(`plan:${planId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_rsvps", filter: `plan_id=eq.${planId}` }, refresh)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "plans", filter: `id=eq.${planId}` }, refresh)
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [planId, router]);

  return null;
}
