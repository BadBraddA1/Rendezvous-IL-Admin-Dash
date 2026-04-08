import { type NextRequest, NextResponse } from "next/server"

// Auth token from environment variable - must match middleware.ts
const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_auth_token_change_me"

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  const adminPassword = process.env.ADMIN_PASSWORD
  const authToken = process.env.AUTH_TOKEN
  
  if (!adminPassword || !authToken) {
    return NextResponse.json({ error: "Server misconfiguration: Missing AUTH_TOKEN or ADMIN_PASSWORD" }, { status: 500 })
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
