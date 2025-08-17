import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/favicon.ico",
];

function isPublic(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.startsWith("/_next") || pathname.startsWith("/public")) return true;
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  if (isPublic(req)) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === "ok") return NextResponse.next();

  // Redirect everything else to /login
  const url = new URL("/login", req.url);
  url.searchParams.set("next", new URL(req.url).pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // protect all pages and APIs except explicitly public ones above
    "/((?!_next|public).*)",
  ],
};
