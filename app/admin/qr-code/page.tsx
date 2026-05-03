import { redirect } from "next/navigation"

export default function QrCodeRedirect() {
  redirect("/admin/qr-codes")
}
