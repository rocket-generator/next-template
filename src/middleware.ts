import { NextResponse } from "next/server";

import { auth } from "@/libraries/auth";

const PUBLIC_PAGES = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export default auth((request: { nextUrl: URL; auth: unknown; url: string }) => {
  const { nextUrl } = request;
  const isAuthenticated = !!request.auth;
  const isPublicPage = PUBLIC_PAGES.includes(nextUrl.pathname);

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
