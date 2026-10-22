"use client";

import { useActionState } from "react";
import { createGroup, joinGroup, type GroupState } from "@/app/actions/group";
import { SubmitButton } from "@/components/small-client";

export function JoinGroupForm({ code }: { code?: string }) {
  const [state, action] = useActionState<GroupState, FormData>(joinGroup, {});

  if (code) {
    return (
      <form action={action} style={{ display: "grid", gap: 12 }}>
        <input type="hidden" name="code" value={code} />
        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton pending="Un instant…">Rejoindre le groupe</SubmitButton>
      </form>
    );
  }

  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <div className="field">
        <label className="field__label" htmlFor="code">
          Lien ou code d&apos;invitation
        </label>
        <input className="input" id="code" name="code" placeholder="Colle le lien reçu sur le groupe" required />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton className="btn btn--primary">Rejoindre</SubmitButton>
    </form>
  );
}

export function CreateGroupForm() {
  const [state, action] = useActionState<GroupState, FormData>(createGroup, {});
  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <div className="field">
        <label className="field__label" htmlFor="group-name">
          Nom du groupe
        </label>
        <input className="input" id="group-name" name="name" defaultValue="The Boyz" maxLength={40} required />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton className="btn btn--outline">Créer le groupe</SubmitButton>
    </form>
  );
}
