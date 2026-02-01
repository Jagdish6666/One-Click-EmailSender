// POST /api/auth/logout - Clear session
import { NextResponse } from "next/server"
import { clearSession } from "@/app/lib/auth"

export async function POST() {
  await clearSession()
  return NextResponse.json({ success: true })
}
