import Link from "next/link";
import { Plus, SearchX, Ticket } from "lucide-react";
import { getUpcomingPlans, requireMember, searchPlans } from "@/lib/data";
import { formatLongDate, isToday } from "@/lib/format";
import { PlanRow, PlanTicket } from "@/components/plan-cards";
import { EmptyState } from "@/components/ui";
import { SearchBox } from "@/components/search-box";
import type { Plan } from "@/lib/types";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const { profile, group, userId } = await requireMember();

  const plans = query ? await searchPlans(group.id, query) : await getUpcomingPlans(group.id);

  // L'en-tête et le champ de recherche restent à la même place dans les deux affichages,
  // pour que le champ garde le focus pendant la frappe.
  return (
    <>
      <div style={{ display: "grid", gap: 6 }}>
        <h1 className="page-title">{query ? "Recherche" : `Salut ${profile.pseudo}`}</h1>
        <p style={{ margin: 0, color: "var(--bz-ink-soft)" }}>{query ? searchSummary(plans.length) : homeSummary(plans)}</p>
      </div>

      <SearchBox initial={query} placeholder="Rechercher un plan, un lieu, une adresse…" />

      {query ? <SearchResults plans={plans} query={query} /> : <Upcoming plans={plans} userId={userId} />}
    </>
  );
}

const searchSummary = (n: number) => (n ? `${n} plan${n > 1 ? "s" : ""} trouvé${n > 1 ? "s" : ""}.` : "Aucun plan trouvé.");

function homeSummary(plans: Plan[]) {
  const dated = plans.filter((p) => p.starts_at);
  const today = dated.filter((p) => isToday(p.starts_at!));
  if (today.length > 1) return `${today.length} plans aujourd'hui.`;
  if (today.length === 1) return `Aujourd'hui : ${today[0].title}.`;
  if (dated[0]) return `Prochain plan ${formatLongDate(dated[0].starts_at!)}.`;
  return "Rien de prévu pour l'instant.";
}

function SearchResults({ plans, query }: { plans: Plan[]; query: string }) {
  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="i" />}
        title="Aucun plan trouvé"
        text={`Rien ne correspond à « ${query} ». Essaie le nom du plan, le lieu ou l'adresse.`}
      />
    );
  }
  return (
    <div className="plan-list">
      {plans.map((p) => (
        <PlanRow key={p.id} plan={p} />
      ))}
    </div>
  );
}

function Upcoming({ plans, userId }: { plans: Plan[]; userId: string }) {
  if (plans.length === 0) {
    return (
      <EmptyState
        icon={<Ticket className="i" />}
        title="Rien de prévu"
        text="Propose un truc, même vague. Les autres diront s'ils sont chauds."
        action={
          <Link className="btn btn--accent" href="/plans/nouveau">
            <Plus className="i" aria-hidden="true" />
            Lance un plan
          </Link>
        }
      />
    );
  }

  const dated = plans.filter((p) => p.starts_at);
  const ideas = plans.filter((p) => !p.starts_at);
  const today = dated.filter((p) => isToday(p.starts_at!));
  // Le plan du jour passe devant ; sinon, le prochain plan daté.
  const featured = today.length ? today : dated.slice(0, 1);
  const later = dated.filter((p) => !featured.includes(p));

  return (
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
  );
}
