"use client";

import { useActionState, useState } from "react";
import { savePlan, type PlanFormState, type PlanFormValues } from "@/app/actions/plans";
import { VIBES, VIBE_LABELS } from "@/lib/types";
import { SubmitButton } from "./small-client";

export function PlanForm({ initial, submitLabel }: { initial: PlanFormValues; submitLabel: string }) {
  const [state, action] = useActionState<PlanFormState, FormData>(savePlan, { values: initial });
  const v = state.values ?? initial;
  const [when, setWhen] = useState(v.when);

  return (
    <form action={action} className="card" style={{ gap: 22 }}>
      <input type="hidden" name="id" value={v.id} />

      <div className="field">
        <label className="field__label" htmlFor="title">
          Nom du plan
        </label>
        <input className="input" id="title" name="title" maxLength={80} placeholder="Ex. Foot à 5 dimanche" defaultValue={v.title} required />
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field__label" style={{ marginBottom: 8 }}>
          La vibe
        </legend>
        <div className="chips">
          {VIBES.map((vibe) => (
            <label key={vibe} className={`chip v-${vibe}`}>
              <input type="radio" name="vibe" id={`vibe-${vibe}`} value={vibe} defaultChecked={v.vibe === vibe} required />
              <span>{VIBE_LABELS[vibe]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field__label" style={{ marginBottom: 8 }}>
          Quand
        </legend>
        <div className="chips">
          <label className="chip">
            <input type="radio" name="when" id="when-date" value="date" checked={when === "date"} onChange={() => setWhen("date")} />
            <span>J&apos;ai une date</span>
          </label>
          <label className="chip">
            <input type="radio" name="when" id="when-later" value="later" checked={when === "later"} onChange={() => setWhen("later")} />
            <span>Date à décider</span>
          </label>
        </div>
        {when === "date" ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: 12, marginTop: 4 }}>
            <div className="field">
              <label className="field__label" htmlFor="date">
                Date
              </label>
              <input className="input" id="date" name="date" type="date" defaultValue={v.date} required />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="time">
                Heure
              </label>
              <input className="input" id="time" name="time" type="time" defaultValue={v.time || "20:00"} required />
            </div>
          </div>
        ) : (
          <span className="field__hint">Le plan apparaît dans « Idées sans date ». Tu mettras la date quand vous serez calés.</span>
        )}
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor="place_name">
          Lieu
        </label>
        <input className="input" id="place_name" name="place_name" maxLength={80} placeholder="Bar, salle, chez quelqu'un…" defaultValue={v.place_name} />
        <span className="field__hint">Laisse vide si c&apos;est encore à décider.</span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="place_address">
          Adresse
        </label>
        <input className="input" id="place_address" name="place_address" maxLength={160} placeholder="Pour ouvrir l'itinéraire en un tap" defaultValue={v.place_address} />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="description">
          Les infos
        </label>
        <textarea
          className="input"
          id="description"
          name="description"
          maxLength={2000}
          placeholder="Ce qu'il faut savoir : budget, dress code, qui conduit…"
          defaultValue={v.description}
        />
      </div>

      <div className="field" style={{ maxWidth: 220 }}>
        <label className="field__label" htmlFor="max_people">
          Nombre de places
        </label>
        <input className="input" id="max_people" name="max_people" type="number" min={1} max={500} inputMode="numeric" placeholder="Pas de limite" defaultValue={v.max_people} />
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton className="btn btn--accent btn--lg" pending="Envoi…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
