"use client"

import { useState } from "react"
import { ArrowLeftRightIcon, RotateCcwIcon, Loader2Icon } from "lucide-react"

export type FamilyMember = {
  id: number
  first_name: string | null
  age: number | null
  is_adult_override: boolean | null
}

export type RegistrationRow = {
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

function isAdult(m: FamilyMember) {
  if (m.is_adult_override !== null && m.is_adult_override !== undefined) {
    return m.is_adult_override
  }
  return m.age === null || m.age === undefined || m.age >= 18
}

function formatPhones(husband?: string | null, wife?: string | null) {
  const phones: string[] = []
  if (husband) phones.push(husband)
  if (wife && wife !== husband) phones.push(wife)
  return phones
}

export function AttendeesTable({
  initialRegistrations,
  canEdit,
}: {
  initialRegistrations: RegistrationRow[]
  canEdit: boolean
}) {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>(initialRegistrations)
  const [savingId, setSavingId] = useState<number | null>(null)

  async function setRole(memberId: number, role: "parent" | "child" | "auto") {
    setSavingId(memberId)
    try {
      const res = await fetch(`/api/family-members/${memberId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error || "Failed to update")
        return
      }
      const newOverride = role === "auto" ? null : role === "parent"
      setRegistrations((prev) =>
        prev.map((reg) => ({
          ...reg,
          family_members:
            reg.family_members?.map((m) =>
              m.id === memberId ? { ...m, is_adult_override: newOverride } : m,
            ) ?? null,
        })),
      )
    } catch (err) {
      console.error(err)
      alert("Failed to update")
    } finally {
      setSavingId(null)
    }
  }

  return (
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
          const parents = members.filter(isAdult)
          const children = members.filter((m) => !isAdult(m))
          const phones = formatPhones(reg.husband_phone, reg.wife_phone)
          const isFirstTimer = reg.times_attended === 1
          const lastName = `${reg.family_last_name || ""}${isFirstTimer ? "*" : ""}`

          return (
            <tr key={reg.id}>
              <td className="td-num">{idx + 1}</td>
              <td className="td-lastname font-bold">{lastName}</td>
              <td className="td-center">
                <NameList
                  members={parents}
                  variant="parent"
                  canEdit={canEdit}
                  savingId={savingId}
                  onSetRole={setRole}
                />
              </td>
              <td className="td-center">
                <NameList
                  members={children}
                  variant="child"
                  canEdit={canEdit}
                  savingId={savingId}
                  onSetRole={setRole}
                />
              </td>
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
  )
}

function NameList({
  members,
  variant,
  canEdit,
  savingId,
  onSetRole,
}: {
  members: FamilyMember[]
  variant: "parent" | "child"
  canEdit: boolean
  savingId: number | null
  onSetRole: (memberId: number, role: "parent" | "child" | "auto") => void
}) {
  if (members.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-0.5 print:gap-0">
      {members.map((m, i) => {
        const name = (m.first_name || "").trim()
        const label = variant === "parent" ? name : `${name}${m.age != null ? ` (${m.age})` : ""}`
        const prefix = variant === "parent" && i > 0 ? "& " : ""
        const isOverridden = m.is_adult_override !== null && m.is_adult_override !== undefined
        const oppositeRole = variant === "parent" ? "child" : "parent"
        const swapTitle =
          variant === "parent" ? "Move to CHILDREN" : "Move to PARENTS"

        return (
          <span key={m.id} className="inline-flex items-center gap-1 leading-tight">
            <span className={isOverridden ? "underline decoration-dotted decoration-amber-600" : ""}>
              {prefix}
              {label}
            </span>
            {canEdit && (
              <span className="no-print inline-flex items-center print:hidden">
                <button
                  type="button"
                  onClick={() => onSetRole(m.id, oppositeRole)}
                  disabled={savingId === m.id}
                  title={swapTitle}
                  aria-label={swapTitle}
                  className="ml-0.5 rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40"
                >
                  {savingId === m.id ? (
                    <Loader2Icon className="size-3 animate-spin" />
                  ) : (
                    <ArrowLeftRightIcon className="size-3" />
                  )}
                </button>
                {isOverridden && (
                  <button
                    type="button"
                    onClick={() => onSetRole(m.id, "auto")}
                    disabled={savingId === m.id}
                    title="Reset to age-based default"
                    aria-label="Reset to age-based default"
                    className="rounded p-0.5 text-amber-600 hover:bg-amber-100"
                  >
                    <RotateCcwIcon className="size-3" />
                  </button>
                )}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
