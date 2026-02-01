// Simple session-based auth: we store userId in a signed cookie
// For demo we use a simple cookie; in production use httpOnly + secure
import { cookies } from "next/headers"
import { prisma } from "./prisma"

const COOKIE_NAME = "cert_admin_session"

/**
 * Get current user from session cookie (userId)
 */
export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get(COOKIE_NAME)
  if (!session?.value) return null
  const user = await prisma.user.findUnique({
    where: { id: session.value },
  })
  return user
}

/**
 * Set session cookie after login (store userId)
 */
export async function setSession(userId) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

/**
 * Clear session (logout)
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
