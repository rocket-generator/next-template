import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = new Set([
  "/",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-email/resend",
  "/verify-email/pending",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }
  if (pathname.startsWith("/data/") || pathname.startsWith("/images/")) {
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPage = isPublicPath(pathname);
  const sessionCookie = getSessionCookie(request);

  if (!publicPage && !sessionCookie) {
    const redirectUrl = new URL("/signin", request.url);
    redirectUrl.searchParams.set("callback_url", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
