import { type NextRequest, NextResponse } from "next/server"

// Routes under /admin that do NOT require a password
const PUBLIC_ADMIN_PATHS = [
  "/admin/login",
  "/admin/checkin",
  "/admin/checked-in",
]

// Auth token from environment variable - login route sets this value when password is correct
const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_auth_token_change_me"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  // Allow public admin paths (login page + check-in pages)
  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check the auth cookie for our known token
  const cookie = request.cookies.get("admin_auth")

  if (!cookie || cookie.value !== AUTH_TOKEN) {
    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
