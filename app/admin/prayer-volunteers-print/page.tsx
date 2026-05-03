import { getDb } from "@/lib/db"
import { PrintControls } from "../attendees-print/print-controls"

export const dynamic = "force-dynamic"

type Row = {
  id: number
  volunteer_name: string | null
  prayer_type: string | null
  assigned_date: string | null
  time_slot: string | null
  schedule_status: string | null
  notes: string | null
  family_last_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
}

function formatDate(value: string | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export default async function PrayerVolunteersPrintPage() {
  const sql = getDb()

  const rows = (await sql`
    SELECT
      vs.id,
      vs.volunteer_name,
      vs.prayer_type,
      vs.assigned_date,
      vs.time_slot,
      vs.schedule_status,
      vs.notes,
      r.family_last_name,
      r.email,
      COALESCE(r.husband_phone, r.wife_phone) AS phone,
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
  `) as unknown as Row[]

  const year = new Date().getFullYear()

  return (
    <div className="bg-white text-black min-h-screen">
      <PrintControls />

      <main className="print-area mx-auto max-w-[11in] px-6 py-6 print:px-0 print:py-0">
        <h1 className="text-center text-2xl font-bold tracking-wide mb-1 print:mb-2">
          RENDEZVOUS {year} PRAYER VOLUNTEERS
        </h1>
        <p className="text-center text-xs text-gray-600 mb-3 print:mb-2">
          {rows.length} signup{rows.length === 1 ? "" : "s"}
        </p>

        <table className="prayer-table w-full border-collapse">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th>NAME</th>
              <th>FAMILY</th>
              <th>PRAYER</th>
              <th>DAY</th>
              <th>TIME</th>
              <th>STATUS</th>
              <th>PHONE</th>
              <th>EMAIL</th>
              <th>NOTES</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="td-center italic">
                  No prayer volunteers have signed up yet.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={r.id}>
                  <td className="td-num">{idx + 1}</td>
                  <td className="td-center font-semibold">{r.volunteer_name || ""}</td>
                  <td className="td-center">{r.family_last_name || ""}</td>
                  <td className="td-center">{r.prayer_type || ""}</td>
                  <td className="td-center">{formatDate(r.assigned_date)}</td>
                  <td className="td-center">{r.time_slot || ""}</td>
                  <td className="td-center">{r.schedule_status || ""}</td>
                  <td className="td-center">{r.phone || ""}</td>
                  <td className="td-email">{r.email || ""}</td>
                  <td>{r.notes || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </main>

      <style>{`
        .prayer-table {
          font-size: 11px;
          font-family: Arial, Helvetica, sans-serif;
        }
        .prayer-table th,
        .prayer-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: middle;
        }
        .prayer-table thead th {
          background: #f3f4f6;
          font-weight: 700;
          text-align: center;
          font-size: 11px;
        }
        .prayer-table tbody td {
          text-align: left;
        }
        .prayer-table .td-num {
          text-align: center;
          width: 28px;
        }
        .prayer-table .td-center {
          text-align: center;
        }
        .prayer-table .td-email {
          text-align: center;
          word-break: break-all;
        }
        .prayer-table .th-num { width: 28px; }

        @media print {
          @page {
            size: letter landscape;
            margin: 0.4in;
          }
          html, body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .prayer-table {
            font-size: 10px;
          }
          .prayer-table thead {
            display: table-header-group;
          }
          .prayer-table tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
