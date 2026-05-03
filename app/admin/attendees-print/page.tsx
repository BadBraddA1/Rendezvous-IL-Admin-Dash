import { getDb } from "@/lib/db"
import { cookies } from "next/headers"
import { PrintControls } from "./print-controls"
import { AttendeesTable, type RegistrationRow } from "./attendees-table"

export const dynamic = "force-dynamic"

const AUTH_TOKEN = process.env.AUTH_TOKEN || "default_auth_token_change_me"

export default async function AttendeesPrintPage() {
  const sql = getDb()
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get("admin_auth")?.value === AUTH_TOKEN

  const registrations = (await sql`
    SELECT
      r.id,
      r.family_last_name,
      r.address,
      r.city,
      r.state,
      r.zip,
      r.husband_phone,
      r.wife_phone,
      r.email,
      r.times_attended,
      json_agg(
        json_build_object(
          'id', fm.id,
          'first_name', fm.first_name,
          'age', fm.age,
          'is_adult_override', fm.is_adult_override
        ) ORDER BY fm.age DESC NULLS LAST
      ) FILTER (WHERE fm.id IS NOT NULL) as family_members
    FROM registrations r
    LEFT JOIN family_members fm ON fm.registration_id = r.id
    GROUP BY r.id
    ORDER BY r.family_last_name
  `) as unknown as RegistrationRow[]

  const year = new Date().getFullYear()

  return (
    <div className="bg-white text-black min-h-screen">
      <PrintControls />

      <main className="print-area mx-auto max-w-[11in] px-6 py-6 print:px-0 print:py-0">
        <h1 className="text-center text-2xl font-bold tracking-wide mb-3 print:mb-2">
          RENDEZVOUS {year} ATTENDEES
        </h1>

        {isAdmin ? (
          <p className="no-print text-xs text-slate-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 mb-3 print:hidden">
            <span className="font-semibold">Edit mode:</span> click the arrow next to any name to move it between PARENTS and CHILDREN. Manual overrides show with a dotted underline; click the reset icon to revert to age-based default. Edits are saved automatically and hidden when printing.
          </p>
        ) : (
          <p className="no-print text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3 print:hidden">
            Sign in as an admin to manually move names between PARENTS and CHILDREN.
          </p>
        )}

        <AttendeesTable initialRegistrations={registrations} canEdit={isAdmin} />
      </main>

      <style>{`
        .attendee-table {
          font-size: 11px;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.25;
        }
        .attendee-table th,
        .attendee-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: middle;
        }
        .attendee-table thead th {
          background: #f3f4f6;
          font-weight: 700;
          text-align: center;
          font-size: 11px;
        }
        .attendee-table tbody td {
          text-align: left;
        }
        .attendee-table .td-num {
          text-align: center;
          width: 28px;
        }
        .attendee-table .td-center {
          text-align: center;
        }
        .attendee-table .td-lastname {
          text-align: center;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .attendee-table .td-email {
          text-align: center;
          word-break: break-all;
        }
        .attendee-table .th-num { width: 28px; }
        .attendee-table .th-st { width: 36px; }
        .attendee-table .th-zip { width: 56px; }

        /* Compact mode (toggled on screen + applied to print) */
        .print-area[data-compact="true"] .attendee-table {
          font-size: 8.5px;
          line-height: 1.15;
        }
        .print-area[data-compact="true"] .attendee-table th,
        .print-area[data-compact="true"] .attendee-table td {
          padding: 1.5px 3px;
        }
        .print-area[data-compact="true"] .attendee-table thead th {
          font-size: 8.5px;
        }
        .print-area[data-compact="true"] h1 {
          font-size: 14px;
          margin-bottom: 4px;
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
          .attendee-table {
            font-size: 9.5px;
          }
          .attendee-table th,
          .attendee-table td {
            padding: 2px 4px;
          }
          .attendee-table thead {
            display: table-header-group;
          }
          .attendee-table tr {
            page-break-inside: avoid;
          }

          /* Compact print: aggressively shrink to fit one letter-landscape page */
          .print-area[data-compact="true"] {
            zoom: 0.92;
          }
          @page :first {
            margin-top: 0.3in;
          }
          .print-area[data-compact="true"] .attendee-table {
            font-size: 7.5px;
            line-height: 1.1;
          }
          .print-area[data-compact="true"] .attendee-table th,
          .print-area[data-compact="true"] .attendee-table td {
            padding: 1px 2.5px;
          }
        }
      `}</style>
    </div>
  )
}
