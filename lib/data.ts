import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dayKey, parisToIso } from "@/lib/format";
import type { Group, Plan, Profile } from "@/lib/types";

const PROFILE_FIELDS = "id, pseudo, color, avatar_url";

const PLAN_SELECT = `
  id, group_id, created_by, title, description, vibe, status, starts_at, ends_at,
  place_name, place_address, max_people, link_url, cover_path, created_at,
  creator:profiles!plans_created_by_fkey(${PROFILE_FIELDS}),
  rsvps:plan_rsvps(user_id, status, profile:profiles(${PROFILE_FIELDS}))
`;

/** Session courante (une seule lecture par requête). */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  const email = (data?.claims?.email as string | undefined) ?? null;
  return { supabase, userId, email };
});

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session.userId) redirect("/connexion");
  return { ...session, userId: session.userId };
});

export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.from("profiles").select(PROFILE_FIELDS).eq("id", userId).maybeSingle();
  return data as Profile | null;
});

export const getMyGroup = cache(async (): Promise<Group | null> => {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase
    .from("group_members")
    .select("role, group:groups(id, name, invite_code)")
    .eq("user_id", userId)
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (!data?.group) return null;
  return { ...(data.group as unknown as Omit<Group, "role">), role: data.role };
});

/** Garde des pages de l'app : connecté, profil rempli, membre d'un groupe. */
export const requireMember = cache(async () => {
  const session = await requireUser();
  const profile = await getMyProfile();
  if (!profile?.pseudo) redirect("/bienvenue");
  const group = await getMyGroup();
  if (!group) redirect("/rejoindre");
  return { ...session, profile: profile as Profile & { pseudo: string }, group };
});

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Ajoute à chaque plan une URL signée pour son image (bucket privé). */
async function withCovers(supabase: Supabase, rows: unknown[] | null): Promise<Plan[]> {
  const plans = (rows ?? []) as Plan[];
  const paths = plans.map((p) => p.cover_path).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("plan-photos").createSignedUrls(paths, 3600);
    data?.forEach((d) => d.path && d.signedUrl && urls.set(d.path, d.signedUrl));
  }
  return plans.map((p) => ({ ...p, cover_url: p.cover_path ? (urls.get(p.cover_path) ?? null) : null }));
}

const startOfTodayIso = () => parisToIso(dayKey(new Date()), "00:00");

/** Plans à venir (dont ceux du jour) et idées sans date, hors annulés. */
export async function getUpcomingPlans(groupId: string): Promise<Plan[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("plans")
    .select(PLAN_SELECT)
    .eq("group_id", groupId)
    .neq("status", "annule")
    .or(`starts_at.gte."${startOfTodayIso()}",starts_at.is.null`)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return withCovers(supabase, data);
}

/** Plans passés ou annulés, du plus récent au plus ancien. */
export async function getPastPlans(groupId: string, limit = 30): Promise<Plan[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("plans")
    .select(PLAN_SELECT)
    .eq("group_id", groupId)
    .lt("starts_at", startOfTodayIso())
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withCovers(supabase, data);
}

/** Plans datés entre deux instants (pour le calendrier), annulés compris. */
export async function getPlansBetween(groupId: string, fromIso: string, toIso: string): Promise<Plan[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("plans")
    .select(PLAN_SELECT)
    .eq("group_id", groupId)
    .gte("starts_at", fromIso)
    .lt("starts_at", toIso)
    .order("starts_at");
  if (error) throw error;
  return withCovers(supabase, data);
}

/** Recherche dans le nom, le lieu, l'adresse et les infos des plans du groupe. */
export async function searchPlans(groupId: string, query: string): Promise<Plan[]> {
  // On ne garde que lettres, chiffres, espaces, apostrophes et tirets : rien qui casse le filtre PostgREST.
  const q = query.replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();
  if (!q) return [];
  const { supabase } = await requireUser();
  const like = `"%${q}%"`;
  const { data, error } = await supabase
    .from("plans")
    .select(PLAN_SELECT)
    .eq("group_id", groupId)
    .or(`title.ilike.${like},place_name.ilike.${like},place_address.ilike.${like},description.ilike.${like}`)
    .order("starts_at", { ascending: false, nullsFirst: true })
    .limit(50);
  if (error) throw error;
  return withCovers(supabase, data);
}

export async function getPlan(id: string): Promise<Plan | null> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("plans").select(PLAN_SELECT).eq("id", id).maybeSingle();
  if (error && error.code !== "22P02") throw error; // 22P02 : id qui n'est pas un uuid
  if (!data) return null;
  const [plan] = await withCovers(supabase, [data]);
  return plan;
}

export type Member = Pick<Profile, "id" | "pseudo" | "color" | "avatar_url"> & {
  role: "admin" | "membre";
  joined_at: string;
};

export async function getMembers(groupId: string): Promise<Member[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("group_members")
    .select(`role, joined_at, profile:profiles(${PROFILE_FIELDS})`)
    .eq("group_id", groupId)
    .order("joined_at");
  if (error) throw error;
  return (data ?? []).map((m) => ({
    ...(m.profile as unknown as Profile),
    role: m.role,
    joined_at: m.joined_at,
  }));
}
