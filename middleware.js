// Protect /dashboard - redirect to login if not authenticated
import { NextResponse } from "next/server"

export function middleware(request) {
  const { pathname } = request.nextUrl
  // Only protect dashboard
  if (pathname.startsWith("/dashboard")) {
    const session = request.cookies.get("cert_admin_session")
    if (!session?.value) {
      const login = new URL("/login", request.url)
      login.searchParams.set("from", pathname)
      return NextResponse.redirect(login)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
