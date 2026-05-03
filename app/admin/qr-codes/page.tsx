import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, QrCodeIcon } from "lucide-react"
import { getDb } from "@/lib/db"
import { QrCodesView } from "./qr-codes-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface QrRow {
  id: number
  family_last_name: string
  email: string
  checkin_qr_code: string
  family_member_count: number
}

async function getQrCodes(): Promise<QrRow[]> {
  try {
    const sql = getDb()
    const rows = (await sql`
      SELECT
        r.id,
        r.family_last_name,
        r.email,
        r.checkin_qr_code,
        COUNT(fm.id)::int AS family_member_count
      FROM registrations r
      LEFT JOIN family_members fm ON fm.registration_id = r.id
      WHERE r.checkin_qr_code IS NOT NULL
      GROUP BY r.id
      ORDER BY r.family_last_name ASC, r.id ASC
    `) as QrRow[]
    console.log("[v0] QR codes page fetched", rows.length, "rows")
    return rows
  } catch (error) {
    console.error("[v0] Error fetching QR codes:", error)
    return []
  }
}

export default async function QrCodesPage() {
  const rows = await getQrCodes()

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="no-print flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <QrCodeIcon className="size-6" />
              Check-In QR Codes
            </h1>
            <p className="text-sm text-muted-foreground">
              Printable list of every family&apos;s 10-digit code and scannable QR.
            </p>
            <p className="text-xs text-muted-foreground italic mt-1">
              For the old guy, print half page at 67%.
            </p>
          </div>
        </div>

        <QrCodesView rows={rows} />
      </div>
    </div>
  )
}
