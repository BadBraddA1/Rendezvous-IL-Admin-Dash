"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, Send, QrCode, FlaskConical, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EmailPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendingCheckin, setSendingCheckin] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testEmailType, setTestEmailType] = useState<"checkin" | "custom">("checkin")
  const [sendingTest, setSendingTest] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/email/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailType: testEmailType, message }),
    })
      .then((r) => r.json())
      .then((d) => setPreviewHtml(d.html || ""))
      .catch(() => {})
  }, [testEmailType, message])

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ title: "Email Required", description: "Please enter a test email address", variant: "destructive" })
      return
    }
    if (testEmailType === "custom" && (!subject || !message)) {
      toast({ title: "Missing Fields", description: "Please enter subject and message before testing", variant: "destructive" })
      return
    }
    setSendingTest(true)
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail, emailType: testEmailType, subject, message }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Test Email Sent", description: data.message })
      } else {
        toast({ title: "Error", description: data.error || "Failed to send test email", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send test email", variant: "destructive" })
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendCheckinEmails = async () => {
    if (!confirm("This will send check-in QR code emails to ALL registered families. Continue?")) return
    setSendingCheckin(true)
    try {
      const response = await fetch("/api/email/send-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendToAll: true }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Check-In Emails Sent", description: data.message })
      } else {
        toast({ title: "Error", description: data.error || "Failed to send check-in emails", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send check-in emails", variant: "destructive" })
    } finally {
      setSendingCheckin(false)
    }
  }

  const handleSendEmail = async () => {
    if (!subject || !message) {
      toast({ title: "Missing Information", description: "Please enter both subject and message", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      const response = await fetch("/api/email/send-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType: "all", subject, message }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Email Sent", description: `Successfully sent to ${data.recipientCount} recipient(s)` })
        setSubject("")
        setMessage("")
      } else {
        toast({ title: "Error", description: data.error || "Failed to send email", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Email Communications</h1>
          <p className="text-muted-foreground mt-1">Send emails and preview templates before sending to all families</p>
        </div>
      </div>

      <Tabs defaultValue="test">
        <TabsList className="mb-6">
          <TabsTrigger value="test" className="gap-2">
            <FlaskConical className="size-4" />
            Test & Preview
          </TabsTrigger>
          <TabsTrigger value="checkin" className="gap-2">
            <QrCode className="size-4" />
            Check-In QR Codes
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Mail className="size-4" />
            Custom Email
          </TabsTrigger>
        </TabsList>

        {/* Test & Preview Tab */}
        <TabsContent value="test">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="size-5" />
                    Send Test Email
                  </CardTitle>
                  <CardDescription>
                    Send a real email to yourself to check how it looks in your inbox
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTestEmailType("checkin")}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                          testEmailType === "checkin"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <QrCode className="size-4 mb-1" />
                        Check-In QR Code
                      </button>
                      <button
                        onClick={() => setTestEmailType("custom")}
                        className={`p-3 rounded-lg border text-sm font-medium text-left transition-colors ${
                          testEmailType === "custom"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <Mail className="size-4 mb-1" />
                        Custom Email
                      </button>
                    </div>
                  </div>

                  {testEmailType === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="testSubject">Subject</Label>
                        <Input
                          id="testSubject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Email subject line..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="testMessage">Message Body</Label>
                        <Textarea
                          id="testMessage"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your message here — the preview updates live..."
                          rows={8}
                          className="font-mono text-sm"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="testEmailAddr">Send Test To</Label>
                    <Input
                      id="testEmailAddr"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <Button onClick={handleSendTest} disabled={sendingTest} className="w-full">
                    {sendingTest ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Sending Test...
                      </>
                    ) : (
                      <>
                        <FlaskConical className="mr-2 size-4" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Eye className="size-4" />
                Live Preview
              </div>
              <div className="border rounded-xl overflow-hidden bg-muted/20" style={{ height: "600px" }}>
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Loading preview...
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Sample preview using placeholder data. Actual emails will use each family's real information.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Check-In QR Codes Tab */}
        <TabsContent value="checkin">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="size-5" />
                Send Check-In QR Codes
              </CardTitle>
              <CardDescription>
                Send each family their unique check-in QR code, check-in code, and current amount owed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <p className="font-medium mb-2">Each email includes:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>QR code image for quick scanning at check-in</li>
                  <li>10-digit check-in code (backup for manual entry)</li>
                  <li>Complete payment breakdown</li>
                  <li>Amount due at check-in (based on payment status)</li>
                </ul>
              </div>
              <Button onClick={handleSendCheckinEmails} disabled={sendingCheckin} className="w-full" variant="secondary">
                {sendingCheckin ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending Check-In Emails...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 size-4" />
                    Send Check-In QR Codes to All Families
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Email Tab */}
        <TabsContent value="custom">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-5" />
                Send Custom Email
              </CardTitle>
              <CardDescription>Send announcements, reminders, or updates to all registered families</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={12}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Use the Test & Preview tab to check how this looks before sending.
                </p>
              </div>
              <Button onClick={handleSendEmail} disabled={sending} className="w-full">
                {sending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Send Email to All Families
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
