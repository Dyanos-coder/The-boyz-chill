import Link from "next/link";
import { Plus, Ticket } from "lucide-react";
import { getUpcomingPlans, requireMember } from "@/lib/data";
import { formatLongDate, isToday } from "@/lib/format";
import { PlanRow, PlanTicket } from "@/components/plan-cards";
import { EmptyState } from "@/components/ui";

export default async function HomePage() {
  const { profile, group, userId } = await requireMember();
  const plans = await getUpcomingPlans(group.id);

  const dated = plans.filter((p) => p.starts_at);
  const ideas = plans.filter((p) => !p.starts_at);
  const today = dated.filter((p) => isToday(p.starts_at!));
  // Le plan du jour passe devant ; sinon, le prochain plan daté.
  const featured = today.length ? today : dated.slice(0, 1);
  const later = dated.filter((p) => !featured.includes(p));

  const next = dated[0];
  const subline = today.length
    ? today.length > 1
      ? `${today.length} plans aujourd'hui.`
      : `Aujourd'hui : ${today[0].title}.`
    : next
      ? `Prochain plan ${formatLongDate(next.starts_at!)}.`
      : "Rien de prévu pour l'instant.";

  return (
    <>
      <div style={{ display: "grid", gap: 6 }}>
        <h1 className="page-title">Salut {profile.pseudo}</h1>
        <p style={{ margin: 0, color: "var(--bz-ink-soft)" }}>{subline}</p>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<Ticket className="i" />}
          title="Rien de prévu"
          text={`Propose un truc, même vague. Les autres diront s'ils sont chauds.`}
          action={
            <Link className="btn btn--accent" href="/plans/nouveau">
              <Plus className="i" aria-hidden="true" />
              Lance un plan
            </Link>
          }
        />
      ) : (
        <>
          {featured.length > 0 && (
            <section style={{ display: "grid", gap: 14 }}>
              <span className="section-label">{today.length ? "Aujourd'hui" : "Prochain plan"}</span>
              <div className="ticket-grid">
                {featured.map((p) => (
                  <PlanTicket key={p.id} plan={p} userId={userId} />
                ))}
              </div>
            </section>
          )}

          <div className="home-lists">
            {later.length > 0 && (
              <section style={{ display: "grid", gap: 10 }}>
                <span className="section-label">Plus tard</span>
                <div className="plan-list">
                  {later.map((p) => (
                    <PlanRow key={p.id} plan={p} />
                  ))}
                </div>
              </section>
            )}

            {ideas.length > 0 && (
              <section style={{ display: "grid", gap: 10 }}>
                <span className="section-label">Idées sans date</span>
                <div className="plan-list">
                  {ideas.map((p) => (
                    <PlanRow key={p.id} plan={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </>
  );
}
