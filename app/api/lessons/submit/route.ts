import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET — fetch speaker info by token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  const sql = getDb()

  const speakers = await sql`
    SELECT 
      vs.id,
      vs.volunteer_name as name,
      vs.lesson_title,
      vs.scripture_reading,
      lt.title as topic_title
    FROM volunteer_signups vs
    LEFT JOIN lesson_topics lt ON lt.id = vs.claimed_lesson_id
    WHERE vs.lesson_bid_token = ${token}
      AND vs.claimed_lesson_id IS NOT NULL
  `

  if (speakers.length === 0) {
    return NextResponse.json({ 
      error: "Invalid or expired link. You may not have claimed a topic yet." 
    }, { status: 404 })
  }

  const speaker = speakers[0]
  return NextResponse.json({
    name: speaker.name,
    topicTitle: speaker.topic_title,
    lessonTitle: speaker.lesson_title || "",
    scriptureReading: speaker.scripture_reading || "",
  })
}

// POST — save lesson title and scripture reading
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, lessonTitle, scriptureReading } = body

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  if (!lessonTitle?.trim()) {
    return NextResponse.json({ error: "Lesson title is required" }, { status: 400 })
  }

  const sql = getDb()

  // Verify the token and that they have claimed a topic
  const speakers = await sql`
    SELECT id FROM volunteer_signups
    WHERE lesson_bid_token = ${token}
      AND claimed_lesson_id IS NOT NULL
  `

  if (speakers.length === 0) {
    return NextResponse.json({ 
      error: "Invalid token or you haven't claimed a topic yet" 
    }, { status: 404 })
  }

  // Update the speaker's lesson details
  await sql`
    UPDATE volunteer_signups
    SET 
      lesson_title = ${lessonTitle.trim()},
      scripture_reading = ${scriptureReading?.trim() || null},
      lesson_details_submitted_at = NOW()
    WHERE lesson_bid_token = ${token}
  `

  return NextResponse.json({ 
    success: true,
    message: "Lesson details saved successfully"
  })
}
