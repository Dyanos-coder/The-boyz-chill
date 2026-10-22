import Link from "next/link";
import { requireMember } from "@/lib/data";
import { Avatar, Logo } from "@/components/ui";
import { SideNav, TabBar } from "@/components/tab-bar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { profile, group } = await requireMember();

  return (
    <div className="app-frame">
      <SideNav
        logo={<Logo size="1.6rem" />}
        footer={
          <Link href="/moi" className="link-plain side-profile">
            <Avatar profile={profile} />
            <span style={{ display: "grid", minWidth: 0 }}>
              <strong className="side-profile__name">{profile.pseudo}</strong>
              <span className="section-label">{group.name}</span>
            </span>
          </Link>
        }
      />

      <div className="app-main">
        <header className="app-header">
          <div className="shell appbar" style={{ paddingBlock: 14 }}>
            <Link href="/" className="link-plain" aria-label="Accueil">
              <Logo />
            </Link>
            <Link href="/moi" className="link-plain" aria-label="Mon profil">
              <Avatar profile={profile} size="sm" />
            </Link>
          </div>
        </header>
        <main className="shell page">{children}</main>
      </div>

      <TabBar />
    </div>
  );
}
