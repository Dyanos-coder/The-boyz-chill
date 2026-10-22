// Types alignés sur supabase/migrations/0001_init.sql.
// À remplacer plus tard par les types générés : `supabase gen types typescript`.

export const VIBES = ["chill", "soiree", "bouffe", "sport", "gaming", "sortie"] as const;
export type Vibe = (typeof VIBES)[number];

export const VIBE_LABELS: Record<Vibe, string> = {
  chill: "Chill",
  soiree: "Soirée",
  bouffe: "Bouffe",
  sport: "Sport",
  gaming: "Gaming",
  sortie: "Sortie",
};

export type PlanStatus = "idee" | "sondage" | "confirme" | "annule" | "termine";

export const STATUS_LABELS: Record<PlanStatus, string> = {
  idee: "Idée",
  sondage: "Sondage",
  confirme: "Confirmé",
  annule: "Annulé",
  termine: "Terminé",
};

export const RSVP_VALUES = ["chaud", "peut_etre", "pas_dispo"] as const;
export type RsvpStatus = (typeof RSVP_VALUES)[number];

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  chaud: "Chaud",
  peut_etre: "Peut-être",
  pas_dispo: "Pas dispo",
};

export type Profile = {
  id: string;
  pseudo: string | null;
  avatar_url: string | null;
  color: Vibe;
};

export type Group = {
  id: string;
  name: string;
  invite_code: string;
  role: "admin" | "membre";
};

export type Rsvp = {
  user_id: string;
  status: RsvpStatus;
  profile: Pick<Profile, "id" | "pseudo" | "color" | "avatar_url">;
};

export type Plan = {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  vibe: Vibe;
  status: PlanStatus;
  starts_at: string | null;
  ends_at: string | null;
  place_name: string | null;
  place_address: string | null;
  max_people: number | null;
  created_at: string;
  creator: Pick<Profile, "id" | "pseudo" | "color" | "avatar_url"> | null;
  rsvps: Rsvp[];
};
