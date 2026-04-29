"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MailIcon,
  SendIcon,
  CheckCircleIcon,
  ClockIcon,
  UsersIcon,
  BookOpenIcon,
  Loader2Icon,
  LinkIcon,
  TrophyIcon,
  BellIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Presenter {
  id: number
  volunteer_name: string
  volunteer_type: string
  registration_id: number
  family_last_name: string
  email: string
  token: string | null
  email_sent_at: string | null
  claimed_lesson_id: number | null
  submitted_at: string | null
  claimed_topic_title: string | null
}

interface Topic {
  id: number
  title: string
  description: string | null
  sort_order: number
  assigned_presenter_name: string | null
  assigned_day: string | null
  assigned_session: string | null
  claimed_by_bid_id: number | null
  claimed_by_name: string | null
  claimed_by_email: string | null
  claimed_at: string | null
}

const EVENT_DAYS = [
  { label: "Sunday, May 4", value: "2026-05-04" },
  { label: "Monday, May 5", value: "2026-05-05" },
  { label: "Tuesday, May 6", value: "2026-05-06" },
  { label: "Wednesday, May 7", value: "2026-05-07" },
  { label: "Thursday, May 8", value: "2026-05-08" },
]

const TIME_SLOTS = [
  "Morning Session", "Afternoon Session", "Evening Devotion", "Workshop",
]

export default function LessonsPage() {
  const { toast } = useToast()
  const [topics, setTopics] = useState<Topic[]>([])
  const [presenters, setPresenters] = useState<Presenter[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)
  const [loadingPresenters, setLoadingPresenters] = useState(true)
  const [sendingInvites, setSendingInvites] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [sendingSpeakerEmails, setSendingSpeakerEmails] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Topic dialog
  const [topicDialog, setTopicDialog] = useState<{ open: boolean; topic?: Topic }>({ open: false })
  const [topicForm, setTopicForm] = useState({ title: "", description: "" })
  const [savingTopic, setSavingTopic] = useState(false)

  // Assign dialog
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; topic?: Topic }>({ open: false })
  const [assignForm, setAssignForm] = useState({ presenter: "", day: "", session: "" })
  const [savingAssign, setSavingAssign] = useState(false)

  const fetchTopics = async () => {
    const res = await fetch("/api/lessons/topics")
    const data = await res.json()
    setTopics(Array.isArray(data) ? data : [])
    setLoadingTopics(false)
  }

  const fetchPresenters = async () => {
    const res = await fetch("/api/lessons/presenters")
    const data = await res.json()
    setPresenters(Array.isArray(data) ? data : [])
    setLoadingPresenters(false)
  }

  useEffect(() => {
    fetchTopics()
    fetchPresenters()
  }, [])

  // ---------- Topics ----------
  const openAddTopic = () => {
    setTopicForm({ title: "", description: "" })
    setTopicDialog({ open: true })
  }
  const openEditTopic = (t: Topic) => {
    setTopicForm({ title: t.title, description: t.description ?? "" })
    setTopicDialog({ open: true, topic: t })
  }
  const saveTopic = async () => {
    if (!topicForm.title.trim()) return
    setSavingTopic(true)
    try {
      if (topicDialog.topic) {
        await fetch(`/api/lessons/topics/${topicDialog.topic.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: topicForm.title, description: topicForm.description || null }),
        })
        toast({ title: "Topic updated" })
      } else {
        await fetch("/api/lessons/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: topicForm.title, description: topicForm.description || null, sort_order: topics.length }),
        })
        toast({ title: "Topic added" })
      }
      setTopicDialog({ open: false })
      fetchTopics()
    } finally {
      setSavingTopic(false)
    }
  }
  const deleteTopic = async (id: number) => {
    if (!confirm("Delete this topic?")) return
    await fetch(`/api/lessons/topics/${id}`, { method: "DELETE" })
    toast({ title: "Topic deleted" })
    fetchTopics()
  }

  // ---------- Assign ----------
  const openAssign = (t: Topic) => {
    setAssignForm({ presenter: t.assigned_presenter_name ?? "", day: t.assigned_day ?? "", session: t.assigned_session ?? "" })
    setAssignDialog({ open: true, topic: t })
  }
  const saveAssign = async () => {
    if (!assignDialog.topic) return
    setSavingAssign(true)
    try {
      await fetch(`/api/lessons/topics/${assignDialog.topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_presenter_name: assignForm.presenter || null,
          assigned_day: assignForm.day || null,
          assigned_session: assignForm.session || null,
        }),
      })
      toast({ title: "Assignment saved" })
      setAssignDialog({ open: false })
      fetchTopics()
    } finally {
      setSavingAssign(false)
    }
  }

  // ---------- Invites ----------
  const copyLink = (token: string) => {
    const url = `${window.location.origin}/lessons/pick?token=${token}`
    navigator.clipboard.writeText(url)
    toast({ title: "Link copied to clipboard" })
  }
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const sendInvites = async () => {
    const pending = presenters.filter((p) => !p.submitted_at && p.token)
    const ids = selectedIds.size > 0
      ? Array.from(selectedIds)
      : pending.map((p) => p.id)
    if (ids.length === 0) { toast({ title: "No eligible presenters", description: "All have already claimed a topic." }); return }
    setSendingInvites(true)
    try {
      const res = await fetch("/api/lessons/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerIds: ids }),
      })
      const data = await res.json()
      toast({ title: data.message })
      fetchPresenters()
      setSelectedIds(new Set())
    } finally {
      setSendingInvites(false)
    }
  }

  const sendReminders = async () => {
    // Remind only those who got an invite but haven't claimed yet
    const remindable = presenters.filter((p) => !p.submitted_at && p.email_sent_at && p.token)
    const ids = selectedIds.size > 0
      ? Array.from(selectedIds).filter((id) => remindable.some((p) => p.id === id))
      : remindable.map((p) => p.id)
    if (ids.length === 0) {
      toast({ title: "No one to remind", description: "Everyone who got an invite has already claimed a topic, or no invites have been sent yet." })
      return
    }
    setSendingReminders(true)
    try {
      const res = await fetch("/api/lessons/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteerIds: ids }),
      })
      const data = await res.json()
      toast({ title: data.message ?? data.error })
      fetchPresenters()
      setSelectedIds(new Set())
    } finally {
      setSendingReminders(false)
    }
  }

  const emailSpeakers = async () => {
    const speakers = presenters.filter((p) => p.submitted_at && p.claimed_lesson_id)
    if (speakers.length === 0) {
      toast({ title: "No speakers to email", description: "No one has claimed a topic yet." })
      return
    }
    if (!confirm(`Send lesson title & Scripture reading request to ${speakers.length} speaker(s)?`)) return
    
    setSendingSpeakerEmails(true)
    try {
      const res = await fetch("/api/lessons/email-speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      toast({ title: data.message ?? data.error })
    } finally {
      setSendingSpeakerEmails(false)
    }
  }

  const exportSpeakers = () => {
    window.open("/api/lessons/email-speakers", "_blank")
  }

  // ---------- Derived stats ----------
  const submitted = presenters.filter((p) => p.submitted_at)
  const pending = presenters.filter((p) => !p.submitted_at)
  const assigned = topics.filter((t) => t.assigned_presenter_name)

  // Group presenters by claimed topic for the Bids & Assign tab
  const claimedByTopic: Record<number, Presenter> = {}
  for (const p of submitted) {
    if (p.claimed_lesson_id) {
      claimedByTopic[p.claimed_lesson_id] = p
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Lesson Bid System</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {topics.length} topics · {presenters.length} presenters · {submitted.length} claimed
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Topics", value: topics.length, icon: BookOpenIcon, color: "text-amber-700" },
            { label: "Presenters", value: presenters.length, icon: UsersIcon, color: "text-blue-600" },
            { label: "Responded", value: submitted.length, icon: CheckCircleIcon, color: "text-green-600" },
            { label: "Assigned", value: assigned.length, icon: TrophyIcon, color: "text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={cn("size-5 shrink-0", color)} />
                <div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="topics">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="topics" className="gap-2">
              <BookOpenIcon className="size-4" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <MailIcon className="size-4" />
              Invites
              {pending.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {pending.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="bids" className="gap-2">
              <TrophyIcon className="size-4" />
              Bids &amp; Assign
            </TabsTrigger>
          </TabsList>

          {/* ---- TOPICS TAB ---- */}
          <TabsContent value="topics" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {topics.length}/12 topics added
              </p>
              {topics.length < 12 && (
                <Button size="sm" onClick={openAddTopic}>
                  <PlusIcon className="size-3 mr-1" />
                  Add Topic
                </Button>
              )}
            </div>

            {loadingTopics ? (
              <div className="flex justify-center py-12"><Loader2Icon className="size-6 animate-spin text-muted-foreground" /></div>
            ) : topics.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground space-y-2">
                <BookOpenIcon className="size-10 mx-auto opacity-40" />
                <p className="font-medium">No topics yet</p>
                <p className="text-sm">Add up to 12 lesson titles for presenters to choose from.</p>
                <Button size="sm" onClick={openAddTopic} className="mt-2">
                  <PlusIcon className="size-3 mr-1" />
                  Add First Topic
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-3 p-4 bg-card border rounded-xl">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{t.title}</p>
                      {t.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.description}</p>}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {t.claimed_by_bid_id && (
                          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            Claimed
                          </span>
                        )}
                        {t.assigned_presenter_name && (
                          <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            Assigned: {t.assigned_presenter_name}
                            {t.assigned_day ? ` · ${EVENT_DAYS.find((d) => d.value === t.assigned_day)?.label ?? t.assigned_day}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openAssign(t)} className="h-8 px-2 text-xs gap-1">
                        <TrophyIcon className="size-3" />
                        {t.assigned_presenter_name ? "Edit" : "Assign"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditTopic(t)}>
                        <PencilIcon className="size-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteTopic(t.id)} className="hover:text-destructive">
                        <TrashIcon className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ---- INVITES TAB ---- */}
          <TabsContent value="invites" className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {submitted.length} of {presenters.length} have claimed a topic
              </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={sendReminders}
                disabled={sendingReminders || topics.length === 0}
                className="gap-1 border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                {sendingReminders ? <Loader2Icon className="size-3 animate-spin" /> : <BellIcon className="size-3" />}
                {selectedIds.size > 0 ? `Remind ${selectedIds.size} Selected` : "Send Reminders"}
              </Button>
              <Button
                size="sm"
                onClick={sendInvites}
                disabled={sendingInvites || topics.length === 0}
                className="gap-1"
              >
                {sendingInvites ? <Loader2Icon className="size-3 animate-spin" /> : <SendIcon className="size-3" />}
                {selectedIds.size > 0 ? `Send to ${selectedIds.size} Selected` : "Send All Pending"}
              </Button>
            </div>
            </div>

            {topics.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                Add at least one topic before sending invites.
              </div>
            )}

            {loadingPresenters ? (
              <div className="flex justify-center py-12"><Loader2Icon className="size-6 animate-spin text-muted-foreground" /></div>
            ) : presenters.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground space-y-2">
                <UsersIcon className="size-10 mx-auto opacity-40" />
                <p className="font-medium">No lesson presenter volunteers yet</p>
                <p className="text-sm">Volunteers who signed up to present a lesson appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {presenters.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-3 p-4 bg-card border rounded-xl",
                      selectedIds.has(p.id) && "border-primary bg-primary/5"
                    )}
                  >
                    {!p.submitted_at && (
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{p.volunteer_name}</p>
                        <span className="text-xs text-muted-foreground">{p.family_last_name} family · {p.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.submitted_at ? (
                          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircleIcon className="size-3" />
                            Claimed
                          </span>
                        ) : p.email_sent_at ? (
                          <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <MailIcon className="size-3" />
                            Invite sent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <ClockIcon className="size-3" />
                            Not sent
                          </span>
                        )}
                        {p.claimed_topic_title && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <BookOpenIcon className="size-3" />
                            {p.claimed_topic_title}
                          </span>
                        )}
                      </div>
                    </div>
                    {!p.submitted_at && p.token && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(p.token!)}
                        className="h-8 px-2 gap-1 text-xs shrink-0"
                      >
                        <LinkIcon className="size-3" />
                        Copy Link
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ---- BIDS & ASSIGN TAB ---- */}
          <TabsContent value="bids" className="mt-6 space-y-4">
            {/* Speaker Actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {submitted.length} speaker{submitted.length !== 1 ? "s" : ""} have claimed topics
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportSpeakers}
                  disabled={submitted.length === 0}
                  className="gap-1"
                >
                  <DownloadIcon className="size-3" />
                  Export for Resend
                </Button>
                <Button
                  size="sm"
                  onClick={emailSpeakers}
                  disabled={sendingSpeakerEmails || submitted.length === 0}
                  className="gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  {sendingSpeakerEmails ? <Loader2Icon className="size-3 animate-spin" /> : <FileTextIcon className="size-3" />}
                  Email All Speakers
                </Button>
              </div>
            </div>

            {topics.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground space-y-2">
                <TrophyIcon className="size-10 mx-auto opacity-40" />
                <p className="font-medium">No topics yet</p>
                <p className="text-sm">Add lesson topics first, then invite people to claim them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topics.map((t) => {
                  const claimer = claimedByTopic[t.id]
                  const isClaimed = !!claimer || !!t.claimed_by_bid_id
                  const claimerName = claimer?.volunteer_name ?? t.claimed_by_name
                  const claimerEmail = claimer?.email ?? t.claimed_by_email

                  return (
                    <div key={t.id} className={`border rounded-xl overflow-hidden ${isClaimed ? "border-green-200" : "border-border"}`}>
                      <div className={`flex items-center justify-between gap-3 px-5 py-4 ${isClaimed ? "bg-green-50" : "bg-muted/20"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{t.title}</p>
                            {isClaimed ? (
                              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                                <CheckCircleIcon className="size-3" />
                                Claimed
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted border px-2 py-0.5 rounded-full">
                                <ClockIcon className="size-3" />
                                Unclaimed
                              </span>
                            )}
                          </div>
                          {isClaimed && claimerName && (
                            <p className="text-sm text-green-800 mt-1">
                              <strong>{claimerName}</strong>
                              {claimerEmail && <span className="text-green-600 font-normal"> · {claimerEmail}</span>}
                            </p>
                          )}
                          {t.assigned_presenter_name && (
                            <p className="text-xs text-blue-700 mt-1">
                              Assigned: <strong>{t.assigned_presenter_name}</strong>
                              {t.assigned_day && ` · ${EVENT_DAYS.find((d) => d.value === t.assigned_day)?.label ?? t.assigned_day}`}
                              {t.assigned_session && ` · ${t.assigned_session}`}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={t.assigned_presenter_name ? "outline" : "default"}
                          onClick={() => openAssign(t)}
                          className="shrink-0"
                        >
                          <TrophyIcon className="size-3 mr-1" />
                          {t.assigned_presenter_name ? "Edit Assignment" : "Assign Day & Session"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ---- ADD / EDIT TOPIC DIALOG ---- */}
      <Dialog open={topicDialog.open} onOpenChange={(o) => !o && setTopicDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{topicDialog.topic ? "Edit Topic" : "Add Lesson Topic"}</DialogTitle>
            <DialogDescription>
              {topicDialog.topic ? "Update the title or description." : `Topic ${topics.length + 1} of 12`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={topicForm.title}
                onChange={(e) => setTopicForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. The Armor of God"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description shown to invitees..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTopicDialog({ open: false })}>Cancel</Button>
              <Button onClick={saveTopic} disabled={savingTopic || !topicForm.title.trim()}>
                {savingTopic ? <Loader2Icon className="size-3 animate-spin mr-1" /> : null}
                {topicDialog.topic ? "Save Changes" : "Add Topic"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---- ASSIGN PRESENTER DIALOG ---- */}
      <Dialog open={assignDialog.open} onOpenChange={(o) => !o && setAssignDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Presenter</DialogTitle>
            <DialogDescription>{assignDialog.topic?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Presenter Name</Label>
              <Input
                value={assignForm.presenter}
                onChange={(e) => setAssignForm((p) => ({ ...p, presenter: e.target.value }))}
                placeholder="e.g. John Smith"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Day</Label>
              <select
                value={assignForm.day}
                onChange={(e) => setAssignForm((p) => ({ ...p, day: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Select day --</option>
                {EVENT_DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <select
                value={assignForm.session}
                onChange={(e) => setAssignForm((p) => ({ ...p, session: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Select session --</option>
                {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialog({ open: false })}>Cancel</Button>
              <Button onClick={saveAssign} disabled={savingAssign}>
                {savingAssign ? <Loader2Icon className="size-3 animate-spin mr-1" /> : null}
                Save Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
