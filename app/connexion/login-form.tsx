"use client";

import { useActionState } from "react";
import { sendLoginEmail, verifyLoginCode, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/small-client";

export function LoginForm({ suite }: { suite: string }) {
  const [emailState, sendAction] = useActionState<AuthState, FormData>(sendLoginEmail, { step: "email", suite });
  const [codeState, codeAction] = useActionState<AuthState, FormData>(verifyLoginCode, { step: "code" });

  if (emailState.step === "code" && emailState.email) {
    return (
      <form action={codeAction} style={{ display: "grid", gap: 16 }}>
        <p className="form-ok" role="status">
          E-mail envoyé à <strong>{emailState.email}</strong>. Clique sur le lien, ou tape le code reçu ici.
        </p>
        <input type="hidden" name="email" value={emailState.email} />
        <input type="hidden" name="suite" value={suite} />
        <div className="field">
          <label className="field__label" htmlFor="code">
            Code de connexion
          </label>
          <input
            className="input"
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            required
            style={{ fontFamily: "var(--bz-font-mono)", letterSpacing: ".2em", fontSize: "1.25rem" }}
          />
        </div>
        {codeState.error && (
          <p className="form-error" role="alert">
            {codeState.error}
          </p>
        )}
        <SubmitButton pending="Vérification…">Me connecter</SubmitButton>
        <button
          type="submit"
          className="btn btn--ghost"
          formAction={sendAction}
          formNoValidate
        >
          Renvoyer l&apos;e-mail
        </button>
      </form>
    );
  }

  return (
    <form action={sendAction} style={{ display: "grid", gap: 16 }}>
      <input type="hidden" name="suite" value={suite} />
      <div className="field">
        <label className="field__label" htmlFor="email">
          Ton e-mail
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="prenom@exemple.fr"
          defaultValue={emailState.email}
          required
        />
      </div>
      {emailState.error && (
        <p className="form-error" role="alert">
          {emailState.error}
        </p>
      )}
      <SubmitButton pending="Envoi…">Recevoir mon lien</SubmitButton>
    </form>
  );
}
