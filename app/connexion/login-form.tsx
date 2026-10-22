"use client";

import { useActionState, useEffect, useState } from "react";
import { requestPasswordReset, signIn, signUp, type AuthMode, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/small-client";

const ACTIONS = { connexion: signIn, inscription: signUp, oubli: requestPasswordReset };

type Carry = Pick<AuthState, "email" | "info" | "error">;

export function LoginForm({ suite }: { suite: string }) {
  const [view, setView] = useState<{ mode: AuthMode; carry?: Carry }>({ mode: "connexion" });
  const mode = view.mode;
  const setMode = (m: AuthMode, carry?: Carry) => setView({ mode: m, carry });

  // Un formulaire par mode : chacun garde son propre état d'erreur.
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {mode !== "oubli" && (
        <div className="rsvp" role="group" aria-label="Connexion ou inscription">
          <button type="button" data-v="theme" aria-pressed={mode === "connexion"} onClick={() => setMode("connexion")}>
            J&apos;ai un compte
          </button>
          <button type="button" data-v="theme" aria-pressed={mode === "inscription"} onClick={() => setMode("inscription")}>
            Créer un compte
          </button>
        </div>
      )}
      <AuthForm key={mode} mode={mode} initial={{ mode, suite, ...view.carry }} onModeChange={setMode} />
    </div>
  );
}

function AuthForm({
  mode,
  initial,
  onModeChange,
}: {
  mode: AuthMode;
  initial: AuthState;
  onModeChange: (m: AuthMode, carry?: Carry) => void;
}) {
  const [state, action] = useActionState<AuthState, FormData>(ACTIONS[mode], initial);
  const suite = initial.suite ?? "/";

  // L'action peut renvoyer vers un autre mode (ex. « compte créé » → connexion), avec son message.
  useEffect(() => {
    if (state.mode !== mode) onModeChange(state.mode, { email: state.email, info: state.info, error: state.error });
  }, [state, mode, onModeChange]);

  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      <input type="hidden" name="suite" value={suite} />

      {mode === "oubli" && (
        <p style={{ margin: 0, fontSize: "var(--bz-fs-sm)", color: "var(--bz-ink-soft)" }}>
          Entre ton e-mail, tu recevras un lien pour choisir un nouveau mot de passe.
        </p>
      )}

      <div className="field">
        <label className="field__label" htmlFor={`email-${mode}`}>
          E-mail
        </label>
        <input
          className="input"
          id={`email-${mode}`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="prenom@exemple.fr"
          defaultValue={state.email}
          required
        />
      </div>

      {mode !== "oubli" && (
        <div className="field">
          <label className="field__label" htmlFor={`password-${mode}`}>
            Mot de passe
          </label>
          <input
            className="input"
            id={`password-${mode}`}
            name="password"
            type="password"
            autoComplete={mode === "inscription" ? "new-password" : "current-password"}
            minLength={mode === "inscription" ? 8 : undefined}
            required
          />
          {mode === "inscription" && <span className="field__hint">8 caractères minimum.</span>}
        </div>
      )}

      {mode === "inscription" && (
        <div className="field">
          <label className="field__label" htmlFor="password-confirm">
            Confirme le mot de passe
          </label>
          <input className="input" id="password-confirm" name="password_confirm" type="password" autoComplete="new-password" required />
        </div>
      )}

      {state.info && (
        <p className="form-ok" role="status">
          {state.info}
        </p>
      )}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <SubmitButton pending="Un instant…">
        {mode === "connexion" ? "Me connecter" : mode === "inscription" ? "Créer mon compte" : "Recevoir le lien"}
      </SubmitButton>

      {mode === "connexion" && (
        <button type="button" className="btn btn--ghost" onClick={() => onModeChange("oubli")}>
          Mot de passe oublié ?
        </button>
      )}
      {mode === "oubli" && (
        <button type="button" className="btn btn--ghost" onClick={() => onModeChange("connexion")}>
          Retour à la connexion
        </button>
      )}
    </form>
  );
}
