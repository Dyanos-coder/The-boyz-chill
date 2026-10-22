import type { Metadata } from "next";
import { requireMember } from "@/lib/data";
import { PlanForm } from "@/components/plan-form";

export const metadata: Metadata = { title: "Lance un plan" };

export default async function NouveauPlanPage() {
  const { group } = await requireMember();
  return (
    <div className="narrow">
      <h1 className="page-title">Lance un plan</h1>
      <PlanForm
        submitLabel="Lancer le plan"
        groupId={group.id}
        initial={{
          id: "",
          title: "",
          vibe: "chill",
          when: "date",
          date: "",
          time: "20:00",
          place_name: "",
          place_address: "",
          description: "",
          max_people: "",
          link_url: "",
          cover_path: "",
        }}
      />
    </div>
  );
}
