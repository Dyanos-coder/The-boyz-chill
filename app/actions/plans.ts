"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/data";
import { parisToIso } from "@/lib/format";
import { RSVP_VALUES, VIBES, type PlanStatus, type RsvpStatus } from "@/lib/types";

export type PlanFormValues = {
  id: string;
  title: string;
  vibe: string;
  when: "date" | "later";
  date: string;
  time: string;
  place_name: string;
  place_address: string;
  description: string;
  max_people: string;
};

export type PlanFormState = { error?: string; values?: PlanFormValues };

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, { error: `${max} caractères maximum pour ${label}.` });

const planSchema = z
  .object({
    id: z.string(),
    title: z
      .string()
      .trim()
      .min(2, { error: "Donne un nom au plan (2 caractères minimum)." })
      .max(80, { error: "80 caractères maximum pour le nom du plan." }),
    vibe: z.enum(VIBES, { error: "Choisis une vibe." }),
    when: z.enum(["date", "later"]),
    date: z.string(),
    time: z.string(),
    place_name: optionalText(80, "le lieu"),
    place_address: optionalText(160, "l'adresse"),
    description: optionalText(2000, "les infos"),
    max_people: z.string().regex(/^\d*$/, { error: "Le nombre de places doit être un nombre." }),
  })
  .refine((v) => v.when === "later" || /^\d{4}-\d{2}-\d{2}$/.test(v.date), {
    error: "Mets une date, ou choisis « Date à décider ».",
  })
  .refine((v) => v.when === "later" || /^\d{2}:\d{2}$/.test(v.time), {
    error: "Mets une heure pour le plan.",
  });

const field = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export async function savePlan(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const values: PlanFormValues = {
    id: field(formData, "id"),
    title: field(formData, "title"),
    vibe: field(formData, "vibe"),
    when: field(formData, "when") === "later" ? "later" : "date",
    date: field(formData, "date"),
    time: field(formData, "time"),
    place_name: field(formData, "place_name"),
    place_address: field(formData, "place_address"),
    description: field(formData, "description"),
    max_people: field(formData, "max_people"),
  };

  const parsed = planSchema.safeParse(values);
  if (!parsed.success) return { values, error: parsed.error.issues[0].message };
  const v = parsed.data;

  const startsAt = v.when === "date" ? parisToIso(v.date, v.time) : null;
  const row = {
    title: v.title,
    vibe: v.vibe,
    starts_at: startsAt,
    place_name: v.place_name || null,
    place_address: v.place_address || null,
    description: v.description || null,
    max_people: v.max_people ? Math.max(1, Number(v.max_people)) : null,
  };

  const { supabase, userId, group } = await requireMember();

  if (v.id) {
    const { data: current } = await supabase.from("plans").select("status").eq("id", v.id).maybeSingle();
    if (!current) return { values, error: "Ce plan n'existe plus." };
    const keep: PlanStatus[] = ["annule", "termine", "sondage"];
    const status: PlanStatus = keep.includes(current.status) ? current.status : startsAt ? "confirme" : "idee";

    const { error } = await supabase.from("plans").update({ ...row, status }).eq("id", v.id);
    if (error) return { values, error: "La modification n'est pas passée. Seul le créateur ou un admin peut modifier ce plan." };
    revalidatePath("/", "layout");
    redirect(`/plans/${v.id}`);
  }

  const { data: created, error } = await supabase
    .from("plans")
    .insert({ ...row, status: startsAt ? "confirme" : "idee", group_id: group.id, created_by: userId })
    .select("id")
    .single();
  if (error || !created) return { values, error: "Le plan n'a pas pu être créé, réessaie." };

  // Celui qui lance le plan est chaud par défaut.
  await supabase.from("plan_rsvps").insert({ plan_id: created.id, user_id: userId, status: "chaud" });

  revalidatePath("/", "layout");
  redirect(`/plans/${created.id}?nouveau=1`);
}

export async function setRsvp(planId: string, status: RsvpStatus): Promise<{ error?: string }> {
  if (!RSVP_VALUES.includes(status)) return { error: "Réponse inconnue." };
  const { supabase, userId } = await requireMember();

  if (status === "chaud") {
    const { data: plan } = await supabase
      .from("plans")
      .select("max_people, status, rsvps:plan_rsvps(user_id, status)")
      .eq("id", planId)
      .maybeSingle();
    if (!plan) return { error: "Ce plan n'existe plus." };
    if (plan.status === "annule") return { error: "Ce plan est annulé." };
    const chauds = (plan.rsvps as { user_id: string; status: RsvpStatus }[]).filter(
      (r) => r.status === "chaud" && r.user_id !== userId,
    ).length;
    if (plan.max_people && chauds >= plan.max_people) {
      return { error: `C'est complet : ${plan.max_people} places, toutes prises.` };
    }
  }

  const { error } = await supabase
    .from("plan_rsvps")
    .upsert({ plan_id: planId, user_id: userId, status }, { onConflict: "plan_id,user_id" });
  if (error) return { error: "Ta réponse n'est pas passée, réessaie." };

  revalidatePath("/", "layout");
  return {};
}

export async function setPlanCancelled(planId: string, cancelled: boolean) {
  const { supabase } = await requireMember();
  const { data: plan } = await supabase.from("plans").select("starts_at").eq("id", planId).maybeSingle();
  if (!plan) return;
  const status: PlanStatus = cancelled ? "annule" : plan.starts_at ? "confirme" : "idee";
  await supabase.from("plans").update({ status }).eq("id", planId);
  revalidatePath("/", "layout");
}

export async function deletePlan(planId: string) {
  const { supabase } = await requireMember();
  await supabase.from("plans").delete().eq("id", planId);
  revalidatePath("/", "layout");
  redirect("/");
}
