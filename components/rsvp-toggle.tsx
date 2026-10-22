"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setRsvp } from "@/app/actions/plans";
import { RSVP_LABELS, RSVP_VALUES, type RsvpStatus } from "@/lib/types";

export function RsvpToggle({
  planId,
  value,
  disabled = false,
}: {
  planId: string;
  value: RsvpStatus | null;
  disabled?: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function choose(status: RsvpStatus) {
    if (status === optimistic) return;
    setError(null);
    startTransition(async () => {
      setOptimistic(status);
      const res = await setRsvp(planId, status);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="rsvp" role="group" aria-label="Ta réponse">
        {RSVP_VALUES.map((s) => (
          <button
            key={s}
            type="button"
            data-v={s}
            aria-pressed={optimistic === s}
            disabled={disabled}
            onClick={() => choose(s)}
          >
            {RSVP_LABELS[s]}
          </button>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
