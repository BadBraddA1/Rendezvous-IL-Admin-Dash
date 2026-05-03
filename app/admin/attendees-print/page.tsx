import { getDb } from "@/lib/db"
import { PrintControls } from "./print-controls"

export const dynamic = "force-dynamic"

type FamilyMember = {
  first_name: string | null
  age: number | null
}

type RegistrationRow = {
  id: number
  family_last_name: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  husband_phone: string | null
  wife_phone: string | null
  email: string | null
  times_attended: number | null
  family_members: FamilyMember[] | null
}

function formatPhones(husband?: string | null, wife?: string | null) {
  const phones: string[] = []
  if (husband) phones.push(husband)
  if (wife && wife !== husband) phones.push(wife)
  return phones
}

function splitParentsAndChildren(members: FamilyMember[]) {
  const parents: string[] = []
  const children: string[] = []
  for (const m of members) {
    const name = (m.first_name || "").trim()
    if (!name) continue
    const age = m.age
    if (age === null || age === undefined || age >= 18) {
      parents.push(name)
    } else {
      children.push(`${name} (${age})`)
    }
  }
  return { parents, children }
}

function formatParents(parents: string[]) {
  if (parents.length === 0) return ""
  if (parents.length === 1) return parents[0]
  // "Roger\n& Sabrina" style: first name on first line, "& rest" on second
  return `${parents[0]}\n& ${parents.slice(1).join(", ")}`
}

export default async function AttendeesPrintPage() {
  const sql = getDb()

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
          'first_name', fm.first_name,
          'age', fm.age
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

        <table className="attendee-table w-full border-collapse">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th>LAST NAME</th>
              <th>PARENTS</th>
              <th>CHILDREN</th>
              <th>ADDRESS</th>
              <th>CITY</th>
              <th className="th-st">ST</th>
              <th className="th-zip">ZIP</th>
              <th>PHONES</th>
              <th>EMAIL</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg, idx) => {
              const members = reg.family_members || []
              const { parents, children } = splitParentsAndChildren(members)
              const parentsStr = formatParents(parents)
              const childrenStr = children.join(", ")
              const phones = formatPhones(reg.husband_phone, reg.wife_phone)
              const isFirstTimer = reg.times_attended === 1
              const lastName = `${reg.family_last_name || ""}${isFirstTimer ? "*" : ""}`

              return (
                <tr key={reg.id}>
                  <td className="td-num">{idx + 1}</td>
                  <td className="td-lastname font-bold">{lastName}</td>
                  <td className="td-center whitespace-pre-line">{parentsStr}</td>
                  <td className="td-center">{childrenStr}</td>
                  <td className="td-center">{reg.address || ""}</td>
                  <td className="td-center">{reg.city || ""}</td>
                  <td className="td-center">{reg.state || ""}</td>
                  <td className="td-center">{reg.zip || ""}</td>
                  <td className="td-center whitespace-pre-line">{phones.join("\n")}</td>
                  <td className="td-email">{reg.email || ""}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </main>

      <style>{`
        .attendee-table {
          font-size: 11px;
          font-family: Arial, Helvetica, sans-serif;
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
          .attendee-table {
            font-size: 10px;
          }
          .attendee-table thead {
            display: table-header-group;
          }
          .attendee-table tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
