// One-time script to import special assignments
// Run with: npx tsx scripts/import-assignments.ts

const assignments = [
  { activity: "Prepare Check-In Packets & Double-check Packing List", time: "Prepare ahead of time", name: "Stephen Bradd" },
  { activity: "Assembly organizer (speaking & other worship assignments; bring 2 copies of SFP)", time: "Prepare ahead of time", name: "Stephen Bradd" },
  { activity: "Meal Prayer Organizer", time: "All 12 meals", name: "Adam Cozort" },
  { activity: "Take-A-Hike Ice Breaker Game in Room 205/206", time: "Monday 4:00 - 5:00 PM", name: "Caleb Meacham" },
  { activity: "Bring laptop for Power Point usage loaded with digital songbook", time: "Monday before 5 PM", name: "Adin Bradd" },
  { activity: "Make sure A/V is ready for each assembly; run digital song book", time: "Each 9 AM & 7 PM assembly", name: "Adin Bradd" },
  { activity: "Check-in (distribute keys, collect money owed, & help newbies)", time: "Monday 1 - 5 PM", name: "Englishes" },
  { activity: "Small Gym: Black-light dodgeball, Bombardment, & Steal the Bacon", time: "Monday 8 - 9 PM", name: "Abel Bradd" },
  { activity: "Main Gym: 9 Square & Knockout", time: "Monday 9 - 10 PM", name: "Abel Bradd" },
  { activity: "Mom's Session", time: "Tuesday 10 - 11:55 AM", name: "Melissa Collins" },
  { activity: "Young Adult Session (non-parent graduates)", time: "Tuesday 10 - 11:55 AM", name: "Stephen Bradd" },
  { activity: "Miniature Painting Session #1", time: "Tuesday 10 - 11:30 AM", name: "Englishes" },
  { activity: "Small Gym: Black-light dodgeball, Bombardment, & Steal the Bacon", time: "Tuesday 10 - 11 AM", name: "Amos Bradd" },
  { activity: "Main Gym: 9 Square & Knockout", time: "Tuesday 11 - 11:55 AM", name: "Amos Bradd" },
  { activity: "Obstacle course & rope games", time: "Tuesday 1:30 - 2:30 PM", name: "Stephen Bradd" },
  { activity: "Archery", time: "Tuesday 1:30 - 3:30 PM", name: "Brian Collins" },
  { activity: "Human Foosball", time: "Tuesday 3:30 - 4:30 PM", name: "Daniel/Peter Zamfir" },
  { activity: "Play an appropriate childrens' movie in the meeting room", time: "Tuesday 3:30 PM", name: "Adin Bradd" },
  { activity: "Female lifeguard", time: "Tuesday 8 - 10 PM", name: "LWCC Staff" },
  { activity: "Dad's Session", time: "Wednesday 10 - 11:55 AM", name: "Brian Collins" },
  { activity: "Small Gym: Black-light dodgeball, Bombardment, & Steal the Bacon", time: "Wednesday 10 - 11 AM", name: "Isaac Hanes" },
  { activity: "Main Gym: 9 Square & Knockout", time: "Wednesday 11 - 11:55 AM", name: "Isaac Hanes" },
  { activity: "Kickball", time: "Wednesday 1:30 - 2:30 PM", name: "Adam Cozort" },
  { activity: "Gaga Ball Tournament", time: "Wednesday 2:30 - 3:30 PM", name: "Amos Bradd" },
  { activity: "Scrabble Tournament", time: "Wednesday 2:30 - 5:00 PM", name: "Stephen Bradd" },
  { activity: "Play an appropriate childrens' movie in the meeting room", time: "Wednesday 3:30 PM", name: "Adin Bradd" },
  { activity: "Craft in Activity Room", time: "Wednesday 3:30 - 5:00 PM", name: "Jonlyn Meacham & Jill Watson" },
  { activity: "Disc Golf", time: "Wednesday 3:30 - 4:30 PM", name: "Abram Bradd" },
  { activity: "Male lifeguard", time: "Wednesday 8 - 10 PM", name: "LWCC Staff" },
  { activity: "Bible Bowl", time: "Thursday 10 - 10:30 AM", name: "Stephen Bradd" },
  { activity: "Ping Pong Tourney", time: "Thursday 10:20 - 11:55 AM", name: "Ryan Manning" },
  { activity: "Paddle boats & canoes at the beachfront", time: "Thursday 1:30 - 3:30 PM", name: "LWCC Staff" },
  { activity: "Miniature Painting Session #2", time: "Thursday 3 - 5 PM", name: "Englishes" },
  { activity: "Play an appropriate childrens' movie in the meeting room", time: "Thursday 3:30 PM", name: "Adin Bradd" },
  { activity: "Billiards & Air Hockey Tournaments", time: "Thursday 3:30 - 5 PM", name: "Ryan Manning" },
  { activity: "Glow-in-the-Dark Capture the Flag", time: "Thursday 8 - 9 PM", name: "Stephen Bradd" },
  { activity: "Adult/Teen Volleyball", time: "Thursday 9 - 10 PM", name: "Nathan Cozort" },
]

// Parse day from time string
function parseDay(time: string): string | null {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  for (const day of days) {
    if (time.includes(day)) return day
  }
  return null
}

// Format for API
const formatted = assignments.map(a => ({
  activity_name: a.activity,
  assigned_name: a.name,
  time_slot: a.time,
  assigned_date: null, // Will be filled in based on event dates
}))

console.log("Assignments to import:", formatted.length)
console.log(JSON.stringify({ assignments: formatted }, null, 2))
