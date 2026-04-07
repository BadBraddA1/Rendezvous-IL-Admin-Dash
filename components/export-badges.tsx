"use client"

export async function handleExportBadges() {
  try {
    const response = await fetch("/api/export/name-badges")

    if (!response.ok) {
      throw new Error("Failed to export badges")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `name-badges-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting badges:", error)
    alert("Failed to export name badges")
  }
}

export async function handleExportFullData() {
  try {
    const response = await fetch("/api/export/full-registration")
    if (!response.ok) throw new Error("Failed to export")

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `full-registration-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting full data:", error)
    alert("Failed to export registration data")
  }
}

export async function handleExportLWCC() {
  try {
    const response = await fetch("/api/export/lwcc-breakdown")
    if (!response.ok) throw new Error("Failed to export")

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `lwcc-breakdown-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting LWCC data:", error)
    alert("Failed to export LWCC breakdown")
  }
}

export async function handleExportTshirtBreakdown() {
  try {
    const response = await fetch("/api/export/tshirt-breakdown")
    if (!response.ok) throw new Error("Failed to export")

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tshirt-breakdown-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting t-shirt breakdown:", error)
    alert("Failed to export t-shirt breakdown")
  }
}

export async function handleExportResendTshirtOrdered() {
  try {
    const response = await fetch("/api/export/resend-tshirt-ordered")
    if (!response.ok) throw new Error("Failed to export")

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resend-tshirt-ordered-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting t-shirt ordered list:", error)
    alert("Failed to export t-shirt ordered list")
  }
}

export async function handleExportResendNoTshirt() {
  try {
    const response = await fetch("/api/export/resend-no-tshirt")
    if (!response.ok) throw new Error("Failed to export")

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resend-no-tshirt-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting no-tshirt list:", error)
    alert("Failed to export no-tshirt list")
  }
}

export async function handleExportContactInfo() {
  try {
    const response = await fetch("/api/export/contact-info")
    if (!response.ok) throw new Error("Failed to export")

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contact-info-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error("Error exporting contact info:", error)
    alert("Failed to export contact information")
  }
}
