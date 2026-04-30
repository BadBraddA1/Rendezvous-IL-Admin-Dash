"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, Send, QrCode, FlaskConical, Eye, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Info, MessageSquare } from "lucide-react"
import Link from "next/link"

interface TestResult {
  status: "success" | "error" | "pending"
  message: string
  timestamp: Date
  details?: any
}

export default function EmailPage() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sendingCheckin, setSendingCheckin] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testEmailType, setTestEmailType] = useState<"checkin" | "custom">("checkin")
  const [sendingTest, setSendingTest] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [apiStatus, setApiStatus] = useState<"checking" | "configured" | "missing">("checking")
  const [smsApiStatus, setSmsApiStatus] = useState<"checking" | "configured" | "missing">("checking")
  const [testPhone, setTestPhone] = useState("")
  const [testSmsMessage, setTestSmsMessage] = useState("This is a test SMS from Rendezvous 2026!")
  const [sendingSms, setSendingSms] = useState(false)
  const { toast } = useToast()

  // Check if Resend API is configured
  useEffect(() => {
    fetch("/api/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === "configured") {
          setApiStatus("configured")
        } else {
          setApiStatus("missing")
        }
      })
      .catch(() => setApiStatus("missing"))

    // Check if Infobip SMS API is configured
    fetch("/api/sms/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === "configured") {
          setSmsApiStatus("configured")
        } else {
          setSmsApiStatus("missing")
        }
      })
      .catch(() => setSmsApiStatus("missing"))
  }, [])

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

  const addTestResult = (status: TestResult["status"], message: string, details?: any) => {
    setTestResults(prev => [{
      status,
      message,
      timestamp: new Date(),
      details
    }, ...prev.slice(0, 9)]) // Keep last 10 results
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({ title: "Email Required", description: "Please enter a test email address", variant: "destructive" })
      addTestResult("error", "No email address provided")
      return
    }
    if (testEmailType === "custom" && (!subject || !message)) {
      toast({ title: "Missing Fields", description: "Please enter subject and message before testing", variant: "destructive" })
      addTestResult("error", "Subject and message required for custom emails")
      return
    }
    setSendingTest(true)
    addTestResult("pending", `Sending ${testEmailType} test email to ${testEmail}...`)
    
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail, emailType: testEmailType, subject, message }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Test Email Sent", description: data.message })
        addTestResult("success", `Email sent to ${testEmail}`, {
          type: testEmailType,
          subject: testEmailType === "custom" ? subject : "Your Check-In QR Code - Rendezvous 2026",
          recipient: testEmail
        })
      } else {
        toast({ title: "Error", description: data.error || "Failed to send test email", variant: "destructive" })
        addTestResult("error", data.error || "Failed to send test email", { response: data })
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send test email", variant: "destructive" })
      addTestResult("error", `Network error: ${err.message || "Unknown error"}`)
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendTestSms = async () => {
    if (!testPhone) {
      toast({ title: "Phone Required", description: "Please enter a phone number", variant: "destructive" })
      addTestResult("error", "No phone number provided")
      return
    }
    if (!testSmsMessage) {
      toast({ title: "Message Required", description: "Please enter a message", variant: "destructive" })
      addTestResult("error", "No message provided")
      return
    }
    setSendingSms(true)
    addTestResult("pending", `Sending test SMS to ${testPhone}...`)
    
    try {
      const response = await fetch("/api/sms/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: testSmsMessage }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Test SMS Sent", description: data.message })
        addTestResult("success", `SMS sent to ${testPhone}`, { 
          messageId: data.messageId,
          httpStatus: data.debug?.httpStatus,
          phoneSent: data.debug?.phoneSent,
          sender: data.debug?.sender,
          infobipResponse: data.debug?.rawResponse,
        })
      } else {
        toast({ title: "Error", description: data.error || "Failed to send SMS", variant: "destructive" })
        addTestResult("error", data.error || "Failed to send SMS", {
          httpStatus: data.debug?.httpStatus,
          phoneSent: data.debug?.phoneSent,
          sender: data.debug?.sender,
          infobipResponse: data.debug?.rawResponse,
          requestPayload: data.debug?.requestPayload,
        })
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to send SMS", variant: "destructive" })
      addTestResult("error", `Network error: ${err.message || "Unknown error"}`)
    } finally {
      setSendingSms(false)
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
        {/* API Status Badge */}
        <div className="ml-auto">
          {apiStatus === "checking" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Checking API...
            </div>
          )}
          {apiStatus === "configured" && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="size-4" />
              Resend API Connected
            </div>
          )}
          {apiStatus === "missing" && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
              <XCircle className="size-4" />
              Resend API Not Configured
            </div>
          )}
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
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="size-4" />
            Test SMS
          </TabsTrigger>
        </TabsList>

        {/* Test & Preview Tab */}
        <TabsContent value="test">
          {/* How It Works Info */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                <AlertCircle className="size-4" />
                How Email Testing Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-900 space-y-2">
              <p><strong>When you click &quot;Send Test Email&quot;:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>A <strong>real email</strong> is sent via Resend API to the address you enter</li>
                <li>Check-In emails include a sample QR code and placeholder payment data</li>
                <li>Custom emails use the subject/message you typed above</li>
                <li>Subject line is prefixed with <code className="bg-blue-100 px-1 rounded">[TEST]</code> to identify test emails</li>
              </ol>
              <p className="pt-2 border-t border-blue-200 mt-3">
                <strong>Tip:</strong> Enter your own email address to receive the test and verify it looks correct in your inbox.
              </p>
            </CardContent>
          </Card>

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

          {/* Test Results Log */}
          {testResults.length > 0 && (
            <Card className="mt-6 col-span-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="size-4" />
                    Test Activity Log
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setTestResults([])}>
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {testResults.map((result, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                        result.status === "success" ? "bg-green-50 border border-green-200" :
                        result.status === "error" ? "bg-red-50 border border-red-200" :
                        "bg-blue-50 border border-blue-200"
                      }`}
                    >
                      {result.status === "success" && <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />}
                      {result.status === "error" && <XCircle className="size-4 text-red-600 mt-0.5 shrink-0" />}
                      {result.status === "pending" && <Loader2 className="size-4 text-blue-600 mt-0.5 shrink-0 animate-spin" />}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${
                          result.status === "success" ? "text-green-800" :
                          result.status === "error" ? "text-red-800" :
                          "text-blue-800"
                        }`}>
                          {result.message}
                        </p>
                        {result.details && (
                          <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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

        {/* SMS Test Tab */}
        <TabsContent value="sms">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="size-5" />
                      Test SMS (Infobip)
                    </CardTitle>
                    <CardDescription>
                      Send a test SMS to verify your Infobip integration is working
                    </CardDescription>
                  </div>
                  {smsApiStatus === "checking" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                    </div>
                  )}
                  {smsApiStatus === "configured" && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                      <CheckCircle2 className="size-4" />
                      Connected
                    </div>
                  )}
                  {smsApiStatus === "missing" && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                      <XCircle className="size-4" />
                      Not Configured
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testPhone">Phone Number</Label>
                  <Input
                    id="testPhone"
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="(217) 935-5058"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your phone number to receive the test SMS
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testSmsMsg">Message</Label>
                  <Textarea
                    id="testSmsMsg"
                    value={testSmsMessage}
                    onChange={(e) => setTestSmsMessage(e.target.value)}
                    placeholder="Enter test message..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Message will be prefixed with [TEST] when sent
                  </p>
                </div>
                <Button 
                  onClick={handleSendTestSms} 
                  disabled={sendingSms || smsApiStatus !== "configured"} 
                  className="w-full"
                >
                  {sendingSms ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 size-4" />
                      Send Test SMS
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                  <Info className="size-4" />
                  About SMS Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-900 space-y-3">
                <p>
                  SMS messages are sent via <strong>Infobip</strong>. The integration requires:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><code className="bg-blue-100 px-1 rounded">infobip</code> environment variable (API key or JSON config)</li>
                  <li>Optional: <code className="bg-blue-100 px-1 rounded">INFOBIP_BASE_URL</code> (defaults to api.infobip.com)</li>
                  <li>Optional: <code className="bg-blue-100 px-1 rounded">INFOBIP_SENDER</code> (defaults to &quot;Rendezvous&quot;)</li>
                </ul>
                <div className="pt-3 border-t border-blue-200">
                  <p className="font-medium mb-1">Use Cases:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-blue-800">
                    <li>Event reminders and updates</li>
                    <li>Check-in notifications</li>
                    <li>Emergency communications</li>
                    <li>Payment reminders</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
