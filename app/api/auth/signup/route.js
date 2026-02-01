// POST /api/auth/signup - Create new admin account
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/app/lib/prisma"
import { setSession } from "@/app/lib/auth"

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password, name } = body
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || null },
    })
    await setSession(user.id)
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
