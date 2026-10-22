import type { Metadata } from "next";
import { headers } from "next/headers";
import { getMembers, requireMember } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { CopyField } from "@/components/small-client";

export const metadata: Metadata = { title: "Le groupe" };

export default async function GroupePage() {
  const { group, userId } = await requireMember();
  const members = await getMembers(group.id);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const inviteUrl = `${proto}://${host}/rejoindre/${group.invite_code}`;

  return (
    <>
      <h1 className="page-title">{group.name}</h1>

      <section className="card">
        <span className="section-label">Inviter un pote</span>
        <CopyField value={inviteUrl} label="Lien d'invitation" />
      </section>

      <section className="card">
        <span className="section-label">
          {members.length} membre{members.length > 1 ? "s" : ""}
        </span>
        <ul style={{ display: "grid", gap: 12, margin: 0, padding: 0, listStyle: "none" }}>
          {members.map((m) => (
            <li key={m.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar profile={m} />
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 700 }}>
                  {m.pseudo ?? "Nouveau membre"}
                  {m.id === userId && <span style={{ fontWeight: 400, color: "var(--bz-ink-soft)" }}> (toi)</span>}
                </span>
                <span className="status">{m.role === "admin" ? "Admin" : "Membre"}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
