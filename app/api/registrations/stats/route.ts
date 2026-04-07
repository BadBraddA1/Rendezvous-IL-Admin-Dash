import { getDb } from "@/lib/db"

function serializeRow(row: any) {
  const serialized: any = {}
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      serialized[key] = value.toISOString()
    } else if (typeof value === "bigint") {
      serialized[key] = Number(value)
    } else {
      serialized[key] = value
    }
  }
  return serialized
}

export async function GET() {
  try {
    const sql = getDb()
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid,
        COUNT(*) FILTER (WHERE payment_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE payment_status = 'partial') as partial,
        COUNT(*) FILTER (WHERE checked_in = TRUE) as checked_in,
        COALESCE(SUM((SELECT COUNT(*) FROM family_members WHERE registration_id = registrations.id)), 0) as total_attendees,
        COALESCE(SUM((SELECT COUNT(*) FROM family_members fm WHERE fm.registration_id = registrations.id)) FILTER (WHERE checked_in = TRUE), 0) as checked_in_attendees
      FROM registrations
    `

    const lodgingStats = await sql`
      SELECT 
        lodging_type,
        COUNT(*) as registrations,
        SUM((SELECT COUNT(*) FROM family_members WHERE registration_id = registrations.id)) as attendees
      FROM registrations
      WHERE lodging_type IS NOT NULL
      GROUP BY lodging_type
      ORDER BY registrations DESC
    `

    const recentRegistrations = await sql`
      SELECT COUNT(*) as count
      FROM registrations
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `

    const tshirtStats = await sql`
      SELECT
        COALESCE(SUM(quantity), 0)          AS total_shirts,
        COUNT(DISTINCT registration_id)     AS families_with_shirts,
        COALESCE(SUM(price * quantity), 0)  AS tshirt_revenue
      FROM tshirt_orders
    `

    return Response.json({
      overall: {
        ...serializeRow(statsResult[0]),
        recent_week: Number(recentRegistrations[0].count),
      },
      byLodging: lodgingStats.map(serializeRow),
      tshirts: serializeRow(tshirtStats[0]),
    })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return Response.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
