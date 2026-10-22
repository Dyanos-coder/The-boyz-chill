import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Pages accessibles sans être connecté.
const PUBLIC_PATHS = ["/connexion", "/auth", "/configuration"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isSupabaseConfigured) {
    if (pathname.startsWith("/configuration")) return NextResponse.next();
    return NextResponse.redirect(new URL("/configuration", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Rafraîchit la session si besoin, avant le rendu de la page.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isLoggedIn && !isPublic) {
    const url = new URL("/connexion", request.url);
    if (pathname !== "/") url.searchParams.set("suite", pathname + search);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === "/connexion") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
