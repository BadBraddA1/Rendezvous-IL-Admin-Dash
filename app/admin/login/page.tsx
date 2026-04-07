"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LockIcon, EyeIcon, EyeOffIcon } from "lucide-react"

function LoginForm() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        const from = searchParams.get("from") || "/admin"
        // Use hard navigation so the browser sends the new cookie on the next
        // request — router.push() uses the client-side cache and the middleware
        // reads the cookie before it is committed, causing a redirect loop.
        window.location.href = from
      } else {
        const data = await res.json()
        setError(data.error || "Incorrect password")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="pr-10 text-base"
            autoComplete="current-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !password}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Rendezvous 2026</h1>
          <p className="text-sm text-muted-foreground">Admin Dashboard</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
              <LockIcon className="size-5 text-primary" />
            </div>
            <CardTitle className="text-center text-lg">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter the admin password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-muted" />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Check-in staff?{" "}
          <a href="/admin/checkin" className="underline underline-offset-2 hover:text-foreground">
            Go to Check-in
          </a>
        </p>
      </div>
    </div>
  )
}
