import { getDb } from "@/lib/db"
import { PrintControls } from "../attendees-print/print-controls"

export const dynamic = "force-dynamic"

type Row = {
  volunteer_name: string | null
  volunteer_type: string | null
  assigned_date: string | null
  time_slot: string | null
  prayer_type: string | null
  schedule_status: string | null
  claimed_lesson_title: string | null
}

const EVENT_DAYS = [
  { date: "2026-05-04", short: "MON", label: "Monday May 4" },
  { date: "2026-05-05", short: "TUE", label: "Tuesday May 5" },
  { date: "2026-05-06", short: "WED", label: "Wednesday May 6" },
  { date: "2026-05-07", short: "THU", label: "Thursday May 7" },
  { date: "2026-05-08", short: "FRI", label: "Friday May 8" },
]

const TIME_SLOTS = ["Morning Devotion", "Evening Devotion"] as const

// Each slot has these 8 rows, in order. Each row has a label + a matcher that picks
// the right entry out of the rows for a given (date, time_slot).
type RoleDef = {
  label: string
  match: (r: Row) => boolean
}

const ROLES: RoleDef[] = [
  { label: "Opening Prayer", match: (r) => r.volunteer_type === "Leading prayer" && r.prayer_type === "Opening Prayer" },
  { label: "Song Leader A", match: (r) => r.volunteer_type === "Leading singing" && r.prayer_type === "A" },
  { label: "Song Leader B", match: (r) => r.volunteer_type === "Leading singing" && r.prayer_type === "B" },
  { label: "Scripture A", match: (r) => r.volunteer_type === "Reading scripture" && r.prayer_type === "A" },
  { label: "Lesson A", match: (r) => r.volunteer_type === "Presenting a lesson" && r.prayer_type === "A" },
  { label: "Scripture B", match: (r) => r.volunteer_type === "Reading scripture" && r.prayer_type === "B" },
  { label: "Lesson B", match: (r) => r.volunteer_type === "Presenting a lesson" && r.prayer_type === "B" },
  { label: "Closing Prayer", match: (r) => r.volunteer_type === "Leading prayer" && r.prayer_type === "Closing Prayer" },
]

function pickEntry(rows: Row[], date: string, slot: string, role: RoleDef): Row | undefined {
  return rows.find(
    (r) =>
      r.assigned_date === date &&
      r.time_slot === slot &&
      role.match(r),
  )
}

export default async function SchedulePrintPage() {
  const sql = getDb()

  // Pull all scheduled entries; we'll bucket them client-side below.
  const rawRows = (await sql`
    SELECT
      vs.volunteer_name,
      vs.volunteer_type,
      to_char(vs.assigned_date, 'YYYY-MM-DD') AS assigned_date,
      vs.time_slot,
      vs.prayer_type,
      vs.schedule_status,
      lt.title AS claimed_lesson_title
    FROM volunteer_signups vs
    LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
    WHERE vs.assigned_date IS NOT NULL AND vs.time_slot IS NOT NULL
    ORDER BY vs.assigned_date, vs.time_slot, vs.volunteer_type, vs.volunteer_name
  `) as unknown as Row[]

  return (
    <div className="bg-white text-black min-h-screen">
      <PrintControls />

      <main className="print-area mx-auto max-w-[11in] px-6 py-6 print:px-0 print:py-0">
        <h1 className="text-center text-xl font-bold tracking-wide mb-1 print:mb-2">
          RENDEZVOUS 2026 VOLUNTEER SCHEDULE
        </h1>

        {TIME_SLOTS.map((slot) => (
          <section key={slot} className="mb-3 print:mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wide bg-slate-200 px-2 py-1 border border-black border-b-0">
              {slot}
            </h2>
            <table className="schedule-table w-full border-collapse">
              <thead>
                <tr>
                  <th className="th-role">Role</th>
                  {EVENT_DAYS.map((d) => (
                    <th key={d.date} className="th-day">
                      <div className="font-bold">{d.short}</div>
                      <div className="text-[9px] font-normal text-gray-700">
                        {d.label.replace(/^\w+ /, "")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role.label}>
                    <td className="td-role">{role.label}</td>
                    {EVENT_DAYS.map((d) => {
                      const entry = pickEntry(rawRows, d.date, slot, role)
                      const lesson = entry?.claimed_lesson_title?.trim()
                      return (
                        <td key={d.date} className="td-cell">
                          <div className="name">{entry?.volunteer_name || ""}</div>
                          {lesson && (
                            <div className="lesson" title={lesson}>
                              {lesson}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        <p className="text-[9px] text-gray-600 italic text-center mt-2 print:mt-1">
          Empty cells indicate the role has not yet been filled.
        </p>
      </main>

      <style>{`
        .schedule-table {
          font-size: 10px;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.2;
        }
        .schedule-table th,
        .schedule-table td {
          border: 1px solid #000;
          padding: 3px 4px;
          vertical-align: middle;
        }
        .schedule-table thead th {
          background: #f3f4f6;
          font-weight: 700;
          text-align: center;
          font-size: 10px;
        }
        .schedule-table .th-role {
          width: 110px;
          text-align: left;
        }
        .schedule-table .th-day {
          width: 18%;
        }
        .schedule-table .td-role {
          font-weight: 600;
          background: #fafafa;
          white-space: nowrap;
        }
        .schedule-table .td-cell {
          text-align: center;
          vertical-align: middle;
        }
        .schedule-table .td-cell .name {
          font-weight: 500;
        }
        .schedule-table .td-cell .lesson {
          font-size: 8.5px;
          color: #475569;
          font-style: italic;
          margin-top: 1px;
          line-height: 1.1;
          /* clamp long titles to 2 lines so the cell doesn't blow up */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @media print {
          @page {
            size: letter landscape;
            margin: 0.35in;
          }
          html, body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .schedule-table {
            font-size: 9px;
          }
          .schedule-table thead th {
            font-size: 9px;
          }
          .schedule-table th,
          .schedule-table td {
            padding: 2px 3px;
          }
          .schedule-table tr {
            page-break-inside: avoid;
          }
          /* Force everything to fit on one page */
          .print-area {
            zoom: 0.95;
          }
        }
      `}</style>
    </div>
  )
}
