import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getPastPlans, getUpcomingPlans, requireMember } from "@/lib/data";
import { formatMonthYear } from "@/lib/format";
import { PlanRow } from "@/components/plan-cards";
import { EmptyState } from "@/components/ui";
import type { Plan } from "@/lib/types";

export const metadata: Metadata = { title: "Agenda" };

function byMonth(plans: Plan[]) {
  const months = new Map<string, Plan[]>();
  for (const p of plans) {
    const key = formatMonthYear(p.starts_at!);
    months.set(key, [...(months.get(key) ?? []), p]);
  }
  return [...months.entries()];
}

export default async function AgendaPage() {
  const { group } = await requireMember();
  const [upcoming, past] = await Promise.all([getUpcomingPlans(group.id), getPastPlans(group.id)]);
  const dated = upcoming.filter((p) => p.starts_at);

  return (
    <>
      <h1 className="page-title">Agenda</h1>

      {dated.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="i" />}
          title="Agenda vide"
          text="Les plans avec une date apparaissent ici, mois par mois."
        />
      ) : (
        byMonth(dated).map(([month, plans]) => (
          <section key={month} style={{ display: "grid", gap: 10 }}>
            <span className="section-label">{month}</span>
            <div className="plan-list">
              {plans.map((p) => (
                <PlanRow key={p.id} plan={p} />
              ))}
            </div>
          </section>
        ))
      )}

      {past.length > 0 && (
        <section style={{ display: "grid", gap: 10, opacity: 0.85 }}>
          <span className="section-label">Déjà fait</span>
          <div className="plan-list">
            {past.map((p) => (
              <PlanRow key={p.id} plan={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
