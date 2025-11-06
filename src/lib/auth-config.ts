import { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"
import { logAuth } from "@/lib/logger"

// Authorize function for credentials provider
const authorizeCredentials = async (credentials: any) => {
  try {
    logAuth("=".repeat(50))
    logAuth("[AUTH] AUTHORIZE CALLED")
    logAuth("[AUTH] Email:", credentials?.email)
    logAuth("[AUTH] Has password:", !!credentials?.password)
    
    if (!credentials?.email || !credentials?.password) {
      logAuth("[AUTH] ❌ Missing credentials")
      return null
    }

    logAuth("[AUTH] Looking up user in database...")
    const user = await db.user.findUnique({
      where: { email: credentials.email },
    })

    if (!user) {
      logAuth("[AUTH] ❌ User not found:", credentials.email)
      return null
    }

    logAuth("[AUTH] ✅ User found:", {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password
    })

    if (!user.password) {
      logAuth("[AUTH] ❌ User has no password (OAuth account):", credentials.email)
      return null
    }

    logAuth("[AUTH] Validating password...")
    const isPasswordValid = await compare(credentials.password, user.password)

    if (!isPasswordValid) {
      logAuth("[AUTH] ❌ Password invalid for:", credentials.email)
      return null
    }

    logAuth("[AUTH] ✅ Password valid!")

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    }
    
    logAuth("[AUTH] ✅ Authorize successful - returning user:", {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
      hasImage: !!authUser.image
    })
    logAuth("=".repeat(50))

    return authUser
  } catch (error: any) {
    logAuth("[AUTH] ❌❌❌ AUTHORIZATION ERROR:", {
      message: error.message,
      stack: error.stack
    })
    return null
  }
}

// Validate required environment variables (only once, cached)
let configValidated = false
const validateAuthConfig = () => {
  if (configValidated) return // Only validate once
  configValidated = true
  
  const errors: string[] = []
  
  if (!process.env.NEXTAUTH_URL) {
    errors.push("NEXTAUTH_URL is not set")
  } else if (process.env.NEXTAUTH_URL.includes("0.0.0.0") || process.env.NEXTAUTH_URL.includes("localhost")) {
    // Only warn in production builds, not during development
    if (process.env.NODE_ENV === "production") {
      console.warn("[AUTH] ⚠️ NEXTAUTH_URL contains localhost or 0.0.0.0 - this may cause OAuth issues in production")
    }
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push("NEXTAUTH_SECRET is not set")
  }
  
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    errors.push("GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set")
  }
  
  if (process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_ID) {
    errors.push("GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set")
  }
  
  if (errors.length > 0 && process.env.NODE_ENV === "production") {
    console.error("[AUTH] ❌ Configuration errors:", errors.join(", "))
  }
  
  return errors
}

// Validate only once when module is first loaded
validateAuthConfig()

export const authOptions: NextAuthOptions = {
  // Using JWT strategy, so we handle OAuth user creation manually in signIn callback
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      logAuth("[AUTH] signIn callback:", {
        provider: account?.provider,
        email: user.email,
        hasId: !!user.id,
        hasRole: !!(user as any).role
      })
      
      // Handle OAuth sign in - ensure user exists in database with proper role
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          })

          if (!existingUser) {
            // Create new user from OAuth
            const newUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
                role: "USER",
              },
            })
            // Update user object with database ID and role
            user.id = newUser.id
            ;(user as any).role = newUser.role
            console.log("[AUTH] OAuth user created:", newUser.id)
          } else {
            // Update existing user with OAuth data if needed
            const updatedUser = await db.user.update({
              where: { email: user.email },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: existingUser.emailVerified || new Date(),
              },
            })
            // Update user object with database ID and role
            user.id = updatedUser.id
            ;(user as any).role = updatedUser.role
            console.log("[AUTH] OAuth user updated:", updatedUser.id)
          }
        } catch (error: any) {
          console.error("[AUTH] Error creating/updating OAuth user:", error)
          logAuth("[AUTH] ❌ OAuth error details:", {
            message: error?.message,
            code: error?.code,
            stack: error?.stack
          })
          // Check if user exists before deciding whether to block sign in
          const userExists = await db.user.findUnique({
            where: { email: user.email },
          })
          // Don't block sign in for existing users, but log the error
          // This allows users to sign in even if update fails
          if (!userExists) {
            return false
          }
        }
      }
      
      // For credentials provider, always allow sign in
      // The authorize function already validated the user
      logAuth("[AUTH] signIn callback returning true")
      return true
    },
           async jwt({ token, user, account }) {
             logAuth("=".repeat(50))
             logAuth("[AUTH] JWT CALLBACK")
             logAuth("[AUTH] Has user:", !!user)
             logAuth("[AUTH] Has token:", !!token)
             logAuth("[AUTH] Provider:", account?.provider)

             if (user) {
               logAuth("[AUTH] User object:", {
                 id: user.id,
                 email: user.email,
                 name: user.name,
                 role: (user as any).role,
                 hasImage: !!user.image
               })

               // Initial sign in - set token data from user
               token.id = user.id as string
               token.email = user.email as string
               token.name = user.name as string | null

               // Handle role from user object
               const userRole = (user as any).role || "USER"
               token.role = userRole as any

               // Store OAuth tokens for Google Calendar sync
               if (account?.provider === "google") {
                 token.accessToken = account.access_token
                 token.refreshToken = account.refresh_token
                 token.expiresAt = account.expires_at
                 logAuth("[AUTH] Google OAuth tokens stored in JWT")
               }

               logAuth("[AUTH] ✅ Token set from user:", {
                 id: token.id,
                 email: token.email,
                 name: token.name,
                 role: token.role
               })
            } else {
              logAuth("[AUTH] No user object - using existing token")
              logAuth("[AUTH] Current token:", {
                id: token.id,
                email: token.email,
                role: token.role,
                hasAccessToken: !!token.accessToken,
                hasRefreshToken: !!token.refreshToken
              })
              
              // Preserve OAuth tokens when refreshing session
              // Tokens are only set on initial login, so we keep them from existing token
              if (account?.provider === "google" && account.access_token) {
                // Update tokens if new ones are provided (e.g., after refresh)
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token || token.refreshToken
                token.expiresAt = account.expires_at || token.expiresAt
                logAuth("[AUTH] Google OAuth tokens updated in JWT")
              }
            }

            logAuth("=".repeat(50))
      
      // For OAuth, ensure we have role from database if missing
      if (account?.provider === "google" && token.email && !token.role) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
          }
        } catch (error) {
          console.error("Error fetching OAuth user in jwt callback:", error)
        }
      }
      
      // Final validation - ensure all required fields are present
      if (!token.id || !token.email || !token.role) {
        logAuth("[AUTH] ❌ Token missing required fields:", { 
          id: token.id, 
          email: token.email, 
          role: token.role,
          hasUser: !!user
        })
      } else {
        logAuth("[AUTH] ✅ Token validated:", {
          id: token.id,
          email: token.email,
          role: token.role
        })
      }
      
      return token
    },
           async session({ session, token }) {
             logAuth("[AUTH] session callback:", {
               hasSession: !!session,
               hasToken: !!token,
               tokenId: token.id,
               tokenEmail: token.email,
               tokenRole: token.role
             })

             if (session.user && token) {
               session.user.id = token.id as string
               session.user.email = token.email as string
               session.user.name = token.name as string | null
               session.user.role = (token.role as any) || "USER"

               // Add OAuth tokens to session for Google Calendar sync
               if (token.accessToken) {
                 ;(session as any).accessToken = token.accessToken
                 ;(session as any).refreshToken = token.refreshToken
                 ;(session as any).expiresAt = token.expiresAt
               }

               logAuth("[AUTH] ✅ Session user set:", {
                 id: session.user.id,
                 email: session.user.email,
                 role: session.user.role
               })

               // Ensure all required fields are present
               if (!session.user.id || !session.user.email || !session.user.role) {
                 logAuth("[AUTH] ❌ Session missing required fields:", {
                   id: session.user.id,
                   email: session.user.email,
                   role: session.user.role
                 })
               }
             }
             return session
           },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

