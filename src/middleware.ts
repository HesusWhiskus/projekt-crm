import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Only log for protected routes to avoid spam
  const isProtectedRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/protected")
  
  if (isProtectedRoute) {
    console.log("[MIDDLEWARE] Checking route:", pathname)
  }
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Check if user is authenticated
  if (!token) {
    if (isProtectedRoute) {
      console.log("[MIDDLEWARE] No token found, redirecting to signin")
      const signInUrl = new URL("/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  if (isProtectedRoute) {
    console.log("[MIDDLEWARE] Token found:", {
      id: token.id,
      email: token.email,
      role: (token as any).role,
      hasId: !!token.id,
      hasEmail: !!token.email,
      hasRole: !!(token as any).role
    })
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    const role = (token as any).role
    if (role !== "ADMIN") {
      console.log("[MIDDLEWARE] Admin route accessed without ADMIN role, redirecting")
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
    "/api/protected/:path*",
  ],
}

