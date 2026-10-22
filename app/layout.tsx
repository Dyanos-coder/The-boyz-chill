import type { Metadata, Viewport } from "next";
import { Figtree, Martian_Mono, Unbounded } from "next/font/google";
import { themeScript } from "@/components/theme-toggle";
import "./globals.css";

const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], weight: ["600", "700", "800"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const martian = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "The Boyz", template: "%s · The Boyz" },
  description: "Les plans chill, les soirées et les rendez-vous des boyz.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0E22" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${unbounded.variable} ${figtree.variable} ${martian.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
