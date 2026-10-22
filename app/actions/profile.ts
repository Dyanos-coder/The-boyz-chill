"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/data";
import { VIBES } from "@/lib/types";
import { safeNext } from "@/lib/safe-next";
import { SUPABASE_URL } from "@/lib/supabase/config";

export type ProfileState = { error?: string; saved?: boolean; pseudo?: string; color?: string };

const profileSchema = z.object({
  pseudo: z
    .string()
    .trim()
    .min(2, { error: "Ton pseudo doit faire au moins 2 caractères." })
    .max(24, { error: "24 caractères maximum pour le pseudo." })
    .regex(/^[\p{L}\p{N} _.-]+$/u, { error: "Lettres, chiffres, espaces, points, tirets uniquement." }),
  color: z.enum(VIBES, { error: "Choisis une couleur." }),
});

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const raw = { pseudo: String(formData.get("pseudo") ?? ""), color: String(formData.get("color") ?? "") };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ...raw, error: parsed.error.issues[0].message };

  const { supabase, userId } = await requireUser();

  // La photo est envoyée par le navigateur dans le dossier de l'utilisateur ; on refuse toute autre adresse.
  const avatarUrl = String(formData.get("avatar_url") ?? "");
  const avatarPrefix = `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}/`;
  if (avatarUrl && !avatarUrl.startsWith(avatarPrefix)) return { ...raw, error: "La photo n'a pas été envoyée correctement, remets-la." };

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, avatar_url: avatarUrl || null })
    .eq("id", userId);
  if (error) {
    return {
      ...raw,
      error: error.code === "23505" ? "Ce pseudo est déjà pris, trouve autre chose." : "La sauvegarde a échoué, réessaie.",
    };
  }

  revalidatePath("/", "layout");
  const suite = formData.get("suite");
  if (suite) redirect(safeNext(suite));
  return { ...parsed.data, saved: true };
}
