import { NextResponse } from "next/server";

import { auth } from "@/libraries/auth";

const PUBLIC_PAGES = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

export default auth((request: { nextUrl: URL; auth: unknown; url: string }) => {
  const { nextUrl } = request;
  const isAuthenticated = !!request.auth;
  let isPublicPage = PUBLIC_PAGES.includes(nextUrl.pathname);
  if (
    nextUrl.pathname.startsWith("/data/") ||
    nextUrl.pathname.startsWith("/images/")
  ) {
    isPublicPage = true;
  }
  if (!isPublicPage && !isAuthenticated) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.append("callback_url", encodeURI(request.url));
    return Response.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
