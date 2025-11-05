import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get("error")
  
  // Redirect to custom error page with error parameter
  const errorUrl = new URL("/error", request.url)
  if (error) {
    errorUrl.searchParams.set("error", error)
  }
  
  return NextResponse.redirect(errorUrl)
}

