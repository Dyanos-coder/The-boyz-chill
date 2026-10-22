import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { getPlansBetween, requireMember } from "@/lib/data";
import { dayKey, formatDayKey, formatTime, monthGrid, nextDayKey, parisToIso, shiftMonth } from "@/lib/format";
import { PlanRow } from "@/components/plan-cards";
import { EmptyState } from "@/components/ui";
import type { Plan } from "@/lib/types";

export const metadata: Metadata = { title: "Agenda" };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MAX_CHIPS = 3;

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const { mois } = await searchParams;
  const { group } = await requireMember();

  const todayKey = dayKey(new Date());
  const month = typeof mois === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(mois) ? mois : todayKey.slice(0, 7);
  const grid = monthGrid(month);

  const plans = await getPlansBetween(
    group.id,
    parisToIso(grid[0].key, "00:00"),
    parisToIso(nextDayKey(grid[grid.length - 1].key), "00:00"),
  );

  const byDay = new Map<string, Plan[]>();
  for (const p of plans) {
    const key = dayKey(new Date(p.starts_at!));
    byDay.set(key, [...(byDay.get(key) ?? []), p]);
  }
  const monthDays = [...byDay.entries()].filter(([key]) => key.startsWith(month));

  const title = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-15T12:00:00Z`),
  );

  return (
    <>
      <div className="cal-head">
        <h1 className="page-title" style={{ textTransform: "capitalize" }}>
          {title}
        </h1>
        <nav className="cal-nav" aria-label="Changer de mois">
          <Link className="btn btn--outline btn--icon btn--sm" href={`/agenda?mois=${shiftMonth(month, -1)}`} aria-label="Mois précédent">
            <ChevronLeft className="i" />
          </Link>
          {month !== todayKey.slice(0, 7) && (
            <Link className="btn btn--outline btn--sm" href="/agenda">
              Aujourd&apos;hui
            </Link>
          )}
          <Link className="btn btn--outline btn--icon btn--sm" href={`/agenda?mois=${shiftMonth(month, 1)}`} aria-label="Mois suivant">
            <ChevronRight className="i" />
          </Link>
        </nav>
      </div>

      <div className="cal" role="grid" aria-label={`Calendrier ${title}`}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="cal__dow" role="columnheader">
            {d}
          </div>
        ))}
        {grid.map((d) => {
          const dayPlans = byDay.get(d.key) ?? [];
          const extra = dayPlans.length - MAX_CHIPS;
          return (
            <div
              key={d.key}
              role="gridcell"
              className="cal__day"
              data-out={!d.inMonth || undefined}
              data-today={d.key === todayKey || undefined}
              data-busy={dayPlans.length > 0 || undefined}
            >
              <span className="cal__num">{d.day}</span>

              {dayPlans.length > 0 && (
                <>
                  {/* Mobile : des pastilles, un tap descend à la liste du jour */}
                  <a className="cal__dots" href={`#j-${d.key}`} aria-label={`${dayPlans.length} plan(s) le ${formatDayKey(d.key)}`}>
                    {dayPlans.slice(0, MAX_CHIPS).map((p) => (
                      <span key={p.id} className={`cal__dot v-${p.vibe}`} />
                    ))}
                  </a>

                  {/* PC : les plans en toutes lettres, cliquables */}
                  <ul className="cal__plans">
                    {dayPlans.slice(0, MAX_CHIPS).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/plans/${p.id}`}
                          className={`cal__plan v-${p.vibe}`}
                          data-cancelled={p.status === "annule" || undefined}
                          title={p.title}
                        >
                          <span className="cal__time">{formatTime(p.starts_at!)}</span>
                          {p.title}
                        </Link>
                      </li>
                    ))}
                    {extra > 0 && (
                      <li>
                        <a className="cal__more" href={`#j-${d.key}`}>
                          +{extra} autre{extra > 1 ? "s" : ""}
                        </a>
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>

      {monthDays.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="i" />}
          title="Rien ce mois-ci"
          text="Les plans avec une date apparaissent dans le calendrier. Lance-en un ou change de mois."
          action={
            <Link className="btn btn--accent" href="/plans/nouveau">
              Lance un plan
            </Link>
          }
        />
      ) : (
        <div className="cal-list">
          {monthDays.map(([key, dayPlans]) => (
            <section key={key} id={`j-${key}`} className="cal-list__day">
              <span className="section-label">{formatDayKey(key)}</span>
              <div className="plan-list">
                {dayPlans.map((p) => (
                  <PlanRow key={p.id} plan={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
