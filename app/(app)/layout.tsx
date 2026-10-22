import Link from "next/link";
import { requireMember } from "@/lib/data";
import { Avatar, Logo } from "@/components/ui";
import { TabBar } from "@/components/tab-bar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { profile } = await requireMember();

  return (
    <>
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
      <TabBar />
    </>
  );
}
