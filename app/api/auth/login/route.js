// POST /api/auth/login - Login with email and password
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/app/lib/prisma"
import { setSession } from "@/app/lib/auth"

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    await setSession(user.id)
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    console.error("Login error:", err)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
