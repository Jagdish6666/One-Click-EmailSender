// Participants API - GET (list) and POST (add)
// Protected: requires admin session
import { NextResponse } from "next/server"
import { getSession } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { v4 as uuidv4 } from "uuid"

// GET /api/participants - Fetch all participants
export async function GET() {
  // const user = await getSession()
  // if (!user) {
  //   return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  // }
  try {
    const participants = await prisma.participant.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(participants)
  } catch (err) {
    console.error("Fetch participants error:", err)
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}

// POST /api/participants - Add a participant
export async function POST(request) {
  // const user = await getSession()
  // if (!user) {
  //   return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  // }
  try {
    const body = await request.json()
    const { name, email, eventName } = body
    if (!name || !email || !eventName) {
      return NextResponse.json(
        { error: "name, email, and eventName are required" },
        { status: 400 }
      )
    }
    const certificateId = uuidv4().replace(/-/g, "").slice(0, 12).toUpperCase()
    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        eventName,
        certificateId,
        status: "PENDING",
      },
    })
    return NextResponse.json(participant)
  } catch (err) {
    console.error("Add participant error:", err)
    return NextResponse.json({ error: "Failed to add participant" }, { status: 500 })
  }
}
