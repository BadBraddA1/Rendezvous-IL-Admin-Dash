import { type NextRequest, NextResponse } from "next/server"

// Must match the token in middleware.ts
const AUTH_TOKEN = "rendezvous2026_authenticated"

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set("admin_auth", AUTH_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return response
}
