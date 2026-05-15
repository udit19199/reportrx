import { NextResponse, type NextRequest } from "next/server";

import { auth0 } from "@/lib/auth0";

const PROTECTED_PATHS = ["/app", "/settings"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (requiresAuth) {
    const session = await auth0.getSession(request);
    if (!session) {
      const signinUrl = new URL("/auth/signin", request.url);
      signinUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
