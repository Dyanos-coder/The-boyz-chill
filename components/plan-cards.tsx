import Link from "next/link";
import { ChevronRight, Clock, ExternalLink, MapPin } from "lucide-react";
import { formatShort, formatTime, isToday, stubParts } from "@/lib/format";
import type { Plan, RsvpStatus } from "@/lib/types";
import { AvatarStack, PlanStatusTag, VibeBadge } from "./ui";
import { RsvpToggle } from "./rsvp-toggle";

export function countRsvps(plan: Plan) {
  const by = (s: RsvpStatus) => plan.rsvps.filter((r) => r.status === s);
  return { chauds: by("chaud"), peutEtre: by("peut_etre"), pasDispo: by("pas_dispo") };
}

function peopleSummary(plan: Plan) {
  const { chauds, peutEtre } = countRsvps(plan);
  const c = chauds.length;
  const parts = [`${c} chaud${c > 1 ? "s" : ""}`];
  if (peutEtre.length) parts.push(`${peutEtre.length} peut-être`);
  return { chauds, label: parts };
}

/** Le ticket : la carte principale d'un plan. */
export function PlanTicket({
  plan,
  userId,
  linked = true,
  showCover = true,
}: {
  plan: Plan;
  userId: string;
  linked?: boolean;
  showCover?: boolean;
}) {
  const today = plan.starts_at ? isToday(plan.starts_at) : false;
  const stub = plan.starts_at ? stubParts(plan.starts_at) : null;
  const mine = plan.rsvps.find((r) => r.user_id === userId)?.status ?? null;
  const { chauds, label } = peopleSummary(plan);
  const cancelled = plan.status === "annule";

  return (
    <div className="ticket-wrap">
      <article className={`ticket notched${today && !cancelled ? " ticket--today" : ""}`}>
        <div className="ticket__stub">
          {stub ? (
            <>
              <span className="ticket__dow">{today ? "Auj." : stub.dow}</span>
              <span className="ticket__day">{stub.day}</span>
              <span className="ticket__month">{stub.month}</span>
            </>
          ) : (
            <>
              <span className="ticket__dow">Date</span>
              <span className="ticket__day">?</span>
              <span className="ticket__month">à voir</span>
            </>
          )}
        </div>
        <div className="ticket__body">
          {showCover && plan.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ticket__cover" src={plan.cover_url} alt="" loading="lazy" />
          )}
          <div className="ticket__top">
            <VibeBadge vibe={plan.vibe} />
            <PlanStatusTag status={plan.status} label={plan.status === "idee" ? "Date à décider" : undefined} />
          </div>
          <h3 className="ticket__title">
            {linked ? (
              <Link href={`/plans/${plan.id}`} className="link-plain ticket__link">
                {plan.title}
              </Link>
            ) : (
              plan.title
            )}
          </h3>
          {(plan.starts_at || plan.place_name || plan.link_url) && (
            <p className="ticket__meta">
              {plan.starts_at && (
                <span>
                  <Clock size={14} aria-hidden="true" />
                  {formatTime(plan.starts_at)}
                </span>
              )}
              {plan.place_name && (
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {plan.place_name}
                </span>
              )}
              {plan.link_url && (
                <span>
                  <ExternalLink size={14} aria-hidden="true" />
                  Événement
                </span>
              )}
            </p>
          )}
          <div className="ticket__people">
            <AvatarStack profiles={chauds.map((r) => r.profile)} />
            <span>
              <strong>{label[0]}</strong>
              {label[1] && ` · ${label[1]}`}
              {plan.max_people && ` · ${plan.max_people} places`}
            </span>
          </div>
          {!cancelled && <RsvpToggle planId={plan.id} value={mine} />}
        </div>
      </article>
    </div>
  );
}

/** Ligne compacte pour les listes. */
export function PlanRow({ plan }: { plan: Plan }) {
  const stub = plan.starts_at ? stubParts(plan.starts_at) : null;
  const { chauds } = countRsvps(plan);
  return (
    <Link className="plan-row" href={`/plans/${plan.id}`}>
      <span className="plan-row__date">
        <span className="plan-row__day">{stub?.day ?? "?"}</span>
        <span className="plan-row__mon">{stub?.month ?? "date"}</span>
      </span>
      <span className="plan-row__main">
        <span className="plan-row__title">{plan.title}</span>
        <span className="plan-row__meta">
          <VibeBadge vibe={plan.vibe} />
          {plan.status === "annule" ? (
            <PlanStatusTag status="annule" />
          ) : plan.starts_at ? (
            [formatShort(plan.starts_at), plan.place_name].filter(Boolean).join(" · ")
          ) : (
            <PlanStatusTag status="idee" label="Date à décider" />
          )}
        </span>
      </span>
      <AvatarStack profiles={chauds.map((r) => r.profile)} max={3} />
      <ChevronRight size={18} aria-hidden="true" className="i" />
    </Link>
  );
}
