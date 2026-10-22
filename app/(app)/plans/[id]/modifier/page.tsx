import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPlan, requireMember } from "@/lib/data";
import { isoToParis } from "@/lib/format";
import { PlanForm } from "@/components/plan-form";

export const metadata: Metadata = { title: "Modifier le plan" };

export default async function ModifierPlanPage({ params }: PageProps<"/plans/[id]/modifier">) {
  const { id } = await params;
  const { userId, group } = await requireMember();
  const plan = await getPlan(id);
  if (!plan) notFound();
  if (plan.created_by !== userId && group.role !== "admin") redirect(`/plans/${id}`);

  const when = plan.starts_at ? isoToParis(plan.starts_at) : { date: "", time: "20:00" };

  return (
    <div className="narrow">
      <h1 className="page-title">Modifier le plan</h1>
      <PlanForm
        submitLabel="Enregistrer"
        groupId={group.id}
        coverUrl={plan.cover_url}
        initial={{
          id: plan.id,
          title: plan.title,
          vibe: plan.vibe,
          when: plan.starts_at ? "date" : "later",
          date: when.date,
          time: when.time,
          place_name: plan.place_name ?? "",
          place_address: plan.place_address ?? "",
          description: plan.description ?? "",
          max_people: plan.max_people ? String(plan.max_people) : "",
          link_url: plan.link_url ?? "",
          cover_path: plan.cover_path ?? "",
        }}
      />
    </div>
  );
}
