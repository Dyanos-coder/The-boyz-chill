"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword, type PasswordState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/small-client";

export function PasswordForm() {
  const [state, action] = useActionState<PasswordState, FormData>(updatePassword, {});

  if (state.saved) {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <p className="form-ok" role="status">
          Mot de passe changé.
        </p>
        <Link className="btn btn--primary btn--lg" href="/">
          Aller aux plans
        </Link>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      <div className="field">
        <label className="field__label" htmlFor="new-password">
          Nouveau mot de passe
        </label>
        <input className="input" id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        <span className="field__hint">8 caractères minimum.</span>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="new-password-confirm">
          Confirme le mot de passe
        </label>
        <input className="input" id="new-password-confirm" name="password_confirm" type="password" autoComplete="new-password" required />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pending="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
