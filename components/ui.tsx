import type { ReactNode } from "react";
import { STATUS_LABELS, VIBE_LABELS, type PlanStatus, type Profile, type RsvpStatus, type Vibe } from "@/lib/types";

type MiniProfile = Pick<Profile, "id" | "pseudo" | "color" | "avatar_url">;

export function Logo({ size = "1.25rem" }: { size?: string }) {
  return (
    <span className="logo" style={{ fontSize: size }}>
      the boy<b>z</b>
    </span>
  );
}

export function MonoMark({ size = 48 }: { size?: number }) {
  return (
    <span className="mono-mark" style={{ ["--s" as string]: `${size}px` }} aria-hidden="true">
      b<b>z</b>
    </span>
  );
}

const avatarColor = (color: string | null | undefined) => `var(--bz-vibe-${color ?? "chill"})`;

export function Avatar({
  profile,
  size = "md",
  rsvp,
}: {
  profile: MiniProfile;
  size?: "sm" | "md" | "lg";
  rsvp?: RsvpStatus;
}) {
  const initial = (profile.pseudo ?? "?").trim().charAt(0).toUpperCase();
  const cls = size === "md" ? "avatar" : `avatar avatar--${size}`;
  return (
    <span
      className={cls}
      style={{ ["--a" as string]: avatarColor(profile.color) }}
      data-rsvp={rsvp}
      title={profile.pseudo ?? undefined}
    >
      {initial}
    </span>
  );
}

export function AvatarStack({ profiles, max = 4 }: { profiles: MiniProfile[]; max?: number }) {
  if (profiles.length === 0) return <span className="avatars" />;
  const shown = profiles.slice(0, max);
  const rest = profiles.length - shown.length;
  return (
    <span className="avatars">
      {shown.map((p) => (
        <Avatar key={p.id} profile={p} size="sm" />
      ))}
      {rest > 0 && <span className="avatars__more">+{rest}</span>}
    </span>
  );
}

export function VibeBadge({ vibe }: { vibe: Vibe }) {
  return <span className={`badge v-${vibe}`}>{VIBE_LABELS[vibe]}</span>;
}

export function PlanStatusTag({ status, label }: { status: PlanStatus; label?: string }) {
  return <span className={`status status--${status}`}>{label ?? STATUS_LABELS[status]}</span>;
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__art">{icon}</span>
      <h3 className="empty__title">{title}</h3>
      <p className="empty__text">{text}</p>
      {action}
    </div>
  );
}
