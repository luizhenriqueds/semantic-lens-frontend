import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Reachable without a session. The free tier browses; saving anything still prompts a sign-up at
// the point of the action. Everything else (/settings, /groups, /market, /regions) needs one.
export const PUBLIC = [
  "/",
  "/login",
  "/register",
  "/auth",
  "/api/emails/preview",
  "/dashboard",
  "/search",
  "/properties",
  "/property",
  "/alerts",
  "/portfolio",
];

// Segment-wise, so a later /search-admin is not matched by /search.
const isPublic = (path: string) =>
  PUBLIC.some((p) => path === p || (p !== "/" && path.startsWith(`${p}/`)));

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Anonymous browsing is now the common case, and a visitor with no Supabase cookie has no
  // session to refresh and cannot be redirected off a public path - so skip the auth round trip.
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSession && isPublic(request.nextUrl.pathname)) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
