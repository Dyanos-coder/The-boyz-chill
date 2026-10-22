import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin } from "lucide-react";
import { getMembers, getPlan, requireMember } from "@/lib/data";
import { formatLongDate, formatTime } from "@/lib/format";
import { RSVP_LABELS, type Profile, type RsvpStatus } from "@/lib/types";
import { countRsvps, PlanTicket } from "@/components/plan-cards";
import { Avatar } from "@/components/ui";
import { PlanLive } from "@/components/small-client";
import { PlanOwnerActions } from "./owner-actions";

export async function generateMetadata({ params }: PageProps<"/plans/[id]">): Promise<Metadata> {
  const plan = await getPlan((await params).id);
  return { title: plan?.title ?? "Plan" };
}

export default async function PlanPage({ params, searchParams }: PageProps<"/plans/[id]">) {
  const { id } = await params;
  const { nouveau } = await searchParams;
  const { userId, group } = await requireMember();
  const plan = await getPlan(id);
  if (!plan) notFound();

  const members = await getMembers(group.id);
  const { chauds, peutEtre, pasDispo } = countRsvps(plan);
  const answered = new Set(plan.rsvps.map((r) => r.user_id));
  const silent = members.filter((m) => !answered.has(m.id));
  const canManage = plan.created_by === userId || group.role === "admin";
  const mapsUrl = plan.place_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(plan.place_address)}`
    : null;

  const groups: { key: RsvpStatus | "silence"; label: string; people: MiniProfile[] }[] = [
    { key: "chaud", label: RSVP_LABELS.chaud, people: chauds.map((r) => r.profile) },
    { key: "peut_etre", label: RSVP_LABELS.peut_etre, people: peutEtre.map((r) => r.profile) },
    { key: "pas_dispo", label: RSVP_LABELS.pas_dispo, people: pasDispo.map((r) => r.profile) },
    { key: "silence", label: "Pas encore répondu", people: silent },
  ];

  return (
    <>
      <PlanLive planId={plan.id} />
      <Link href="/" className="btn btn--ghost btn--sm" style={{ justifySelf: "start", marginLeft: -10 }}>
        <ChevronLeft className="i" aria-hidden="true" />
        Les plans
      </Link>

      {nouveau && (
        <p className="form-ok" role="status">
          Plan lancé. Partage-le sur le groupe pour que les boyz répondent.
        </p>
      )}
      {plan.status === "annule" && (
        <p className="form-error" role="status">
          Ce plan est annulé.
        </p>
      )}

      <PlanTicket plan={plan} userId={userId} linked={false} />

      <section className="card">
        <span className="section-label">Les infos</span>
        <dl style={{ display: "grid", gap: 12, margin: 0 }}>
          <div>
            <dt className="field__label">Quand</dt>
            <dd style={{ margin: 0, color: "var(--bz-ink-soft)" }}>
              {plan.starts_at ? `${capitalize(formatLongDate(plan.starts_at))} à ${formatTime(plan.starts_at)}` : "Date à décider"}
            </dd>
          </div>
          {(plan.place_name || plan.place_address) && (
            <div>
              <dt className="field__label">Où</dt>
              <dd style={{ margin: 0, color: "var(--bz-ink-soft)" }}>
                {[plan.place_name, plan.place_address].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
          {plan.description && (
            <div>
              <dt className="field__label">À savoir</dt>
              <dd style={{ margin: 0, color: "var(--bz-ink-soft)", whiteSpace: "pre-line" }}>{plan.description}</dd>
            </div>
          )}
          <div>
            <dt className="field__label">Lancé par</dt>
            <dd style={{ margin: 0, color: "var(--bz-ink-soft)" }}>{plan.creator?.pseudo ?? "un ancien membre"}</dd>
          </div>
        </dl>
        {mapsUrl && (
          <a className="btn btn--outline" href={mapsUrl} target="_blank" rel="noreferrer" style={{ justifySelf: "start" }}>
            <MapPin className="i" aria-hidden="true" />
            Ouvrir l&apos;itinéraire
          </a>
        )}
      </section>

      <section className="card">
        <span className="section-label">
          Qui vient · {chauds.length}
          {plan.max_people ? `/${plan.max_people}` : ""} chaud{chauds.length > 1 ? "s" : ""}
        </span>
        {groups
          .filter((g) => g.people.length > 0)
          .map((g) => (
            <div key={g.key} className="people-group">
              <div className="people-group__head">
                <span className="field__label">{g.label}</span>
                <span className="poll__count">{g.people.length}</span>
              </div>
              <ul className="people-list">
                {g.people.map((p) => (
                  <li key={p.id} className="person">
                    <Avatar profile={p} size="sm" rsvp={g.key === "silence" ? undefined : g.key} />
                    {p.pseudo}
                    {p.id === userId && <span style={{ color: "var(--bz-ink-soft)", fontWeight: 400 }}>(toi)</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>

      {canManage && <PlanOwnerActions planId={plan.id} cancelled={plan.status === "annule"} />}
    </>
  );
}

type MiniProfile = Pick<Profile, "id" | "pseudo" | "color" | "avatar_url">;

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
