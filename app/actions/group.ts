"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/data";

export type GroupState = { error?: string };

export async function createGroup(_prev: GroupState, formData: FormData): Promise<GroupState> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) return { error: "Le nom du groupe fait entre 2 et 40 caractères." };

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_group", { group_name: name });
  if (error) return { error: "Le groupe n'a pas pu être créé, réessaie." };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function joinGroup(_prev: GroupState, formData: FormData): Promise<GroupState> {
  // Accepte le code seul ou le lien d'invitation complet.
  const input = String(formData.get("code") ?? "").trim();
  const code = input.split("/").filter(Boolean).pop() ?? "";
  if (!code) return { error: "Colle le code ou le lien d'invitation." };

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("join_group", { code });
  if (error) return { error: "Ce code ne correspond à aucun groupe. Vérifie-le avec celui qui te l'a envoyé." };

  revalidatePath("/", "layout");
  redirect("/");
}
