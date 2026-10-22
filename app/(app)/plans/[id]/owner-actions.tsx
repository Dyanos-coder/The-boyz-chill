"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Ban, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { deletePlan, setPlanCancelled } from "@/app/actions/plans";
import { ConfirmButton } from "@/components/small-client";

export function PlanOwnerActions({ planId, cancelled }: { planId: string; cancelled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="card">
      <span className="section-label">Gérer le plan</span>
      <div className="row" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link className="btn btn--outline" href={`/plans/${planId}/modifier`}>
          <Pencil className="i" aria-hidden="true" />
          Modifier
        </Link>
        {cancelled ? (
          <button
            type="button"
            className="btn btn--outline"
            disabled={pending}
            onClick={() => startTransition(() => setPlanCancelled(planId, false))}
          >
            <RotateCcw className="i" aria-hidden="true" />
            Remettre le plan
          </button>
        ) : (
          <ConfirmButton
            label={
              <>
                <Ban className="i" aria-hidden="true" />
                Annuler le plan
              </>
            }
            confirmLabel="Oui, annuler"
            onConfirm={() => setPlanCancelled(planId, true)}
          />
        )}
        <ConfirmButton
          className="btn btn--ghost"
          label={
            <>
              <Trash2 className="i" aria-hidden="true" />
              Supprimer
            </>
          }
          confirmLabel="Supprimer pour de bon"
          onConfirm={() => deletePlan(planId)}
        />
      </div>
    </section>
  );
}
