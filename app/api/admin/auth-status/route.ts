import { type NextRequest, NextResponse } from "next/server"

const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_auth_token_change_me"

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("admin_auth")
  const isAdmin = !!cookie && cookie.value === AUTH_TOKEN
  return NextResponse.json({ isAdmin })
}
