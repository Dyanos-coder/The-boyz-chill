"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "@/app/actions/profile";
import { VIBES, type Vibe } from "@/lib/types";
import { SubmitButton } from "./small-client";
import { AvatarPicker } from "./avatar-picker";

const COLOR_NAMES: Record<Vibe, string> = {
  chill: "Lavande",
  soiree: "Magenta",
  bouffe: "Orange",
  sport: "Vert",
  gaming: "Turquoise",
  sortie: "Ocre",
};

export function ProfileForm({
  userId,
  pseudo,
  color,
  avatarUrl,
  suite,
  submitLabel,
}: {
  userId: string;
  pseudo: string;
  color: Vibe;
  avatarUrl: string | null;
  suite?: string;
  submitLabel: string;
}) {
  const [state, action] = useActionState<ProfileState, FormData>(saveProfile, { pseudo, color });
  const current = (state.color ?? color) as Vibe;

  return (
    <form action={action} style={{ display: "grid", gap: 20 }}>
      {suite && <input type="hidden" name="suite" value={suite} />}
      <AvatarPicker userId={userId} initialUrl={avatarUrl} initial={(state.pseudo ?? pseudo).trim().charAt(0).toUpperCase()} />
      <div className="field">
        <label className="field__label" htmlFor="pseudo">
          Ton pseudo
        </label>
        <input
          className="input"
          id="pseudo"
          name="pseudo"
          autoComplete="nickname"
          maxLength={24}
          placeholder="Comment les boyz t'appellent"
          defaultValue={state.pseudo ?? pseudo}
          required
        />
        <span className="field__hint">C&apos;est ce nom qui apparaît sur les plans.</span>
      </div>
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field__label" style={{ marginBottom: 8 }}>
          Ta couleur
        </legend>
        <div className="chips">
          {VIBES.map((v) => (
            <label key={v} className={`chip v-${v}`}>
              <input type="radio" name="color" id={`color-${v}`} value={v} defaultChecked={v === current} />
              <span>{COLOR_NAMES[v]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p className="form-ok" role="status">
          Profil enregistré.
        </p>
      )}
      <SubmitButton pending="Enregistrement…">{submitLabel}</SubmitButton>
    </form>
  );
}
