import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return ""
  const s = String(value)
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        vs.volunteer_name,
        vs.prayer_type,
        vs.assigned_date,
        vs.time_slot,
        vs.schedule_status,
        vs.notes,
        r.family_last_name,
        r.email,
        r.phone,
        r.city,
        r.state
      FROM volunteer_signups vs
      LEFT JOIN registrations r ON r.id = vs.registration_id
      WHERE vs.volunteer_type = 'Leading prayer'
      ORDER BY
        COALESCE(vs.assigned_date, '9999-12-31'::date),
        CASE vs.time_slot WHEN 'Morning' THEN 1 WHEN 'Evening' THEN 2 ELSE 3 END,
        r.family_last_name NULLS LAST,
        vs.volunteer_name
    `

    const headers = [
      "Name",
      "Family",
      "Prayer Type",
      "Assigned Date",
      "Time Slot",
      "Schedule Status",
      "Email",
      "Phone",
      "City",
      "State",
      "Notes",
    ]

    const lines = [headers.join(",")]
    for (const r of rows as any[]) {
      const dateStr = r.assigned_date
        ? new Date(r.assigned_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
        : ""
      lines.push(
        [
          escapeCsvField(r.volunteer_name),
          escapeCsvField(r.family_last_name),
          escapeCsvField(r.prayer_type),
          escapeCsvField(dateStr),
          escapeCsvField(r.time_slot),
          escapeCsvField(r.schedule_status),
          escapeCsvField(r.email),
          escapeCsvField(r.phone),
          escapeCsvField(r.city),
          escapeCsvField(r.state),
          escapeCsvField(r.notes),
        ].join(","),
      )
    }

    const csv = lines.join("\n")
    const filename = `prayer-volunteers-${new Date().toISOString().split("T")[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to export prayer volunteers:", error)
    return NextResponse.json({ error: "Failed to export prayer volunteers" }, { status: 500 })
  }
}
