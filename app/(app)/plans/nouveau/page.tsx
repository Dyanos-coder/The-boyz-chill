import type { Metadata } from "next";
import { PlanForm } from "@/components/plan-form";

export const metadata: Metadata = { title: "Lance un plan" };

export default function NouveauPlanPage() {
  return (
    <>
      <h1 className="page-title">Lance un plan</h1>
      <PlanForm
        submitLabel="Lancer le plan"
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
        }}
      />
    </>
  );
}
