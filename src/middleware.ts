import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only log for protected routes to avoid spam (only in development)
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/protected")
  
  if (process.env.NODE_ENV === 'development' && isProtectedRoute) {
    console.log("[MIDDLEWARE] Checking route:", pathname)
  }
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Check if user is authenticated
  if (!token) {
    if (isProtectedRoute) {
      if (process.env.NODE_ENV === 'development') {
        console.log("[MIDDLEWARE] No token found, redirecting to signin")
      }
      const signInUrl = new URL("/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  if (process.env.NODE_ENV === 'development' && isProtectedRoute) {
    console.log("[MIDDLEWARE] Token found:", {
      id: token.id ? '[REDACTED]' : undefined,
      hasId: !!token.id,
      hasEmail: !!token.email,
      hasRole: !!(token as any).role
    })
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    const role = (token as any).role
    if (role !== "ADMIN") {
      if (process.env.NODE_ENV === 'development') {
        console.log("[MIDDLEWARE] Admin route accessed without ADMIN role, redirecting")
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/contacts/:path*",
    "/tasks/:path*",
    "/calendar/:path*",
    "/admin/:path*",
    "/api/((?!auth|organizations|_next|favicon.ico).*)", // Protect all API routes except auth, organizations and Next.js internals
  ],
}

