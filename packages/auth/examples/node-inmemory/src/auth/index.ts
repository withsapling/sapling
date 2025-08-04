import "dotenv/config";
import { createSaplingAuth, authMiddleware as baseAuthMiddleware, optionalAuthMiddleware as baseOptionalAuthMiddleware } from '@sapling/auth'

// Minimal configuration using built-in in-memory database
const authConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // redirectUri auto-generated from baseUrl
  },
  // No database config - uses built-in in-memory storage automatically
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  redirects: {
    success: '/', // Home page after login
    failure: '/login' // Login page after failed login
  },
  cookieOptions: {
    secure: process.env.ENV === 'production',
    sameSite: 'lax' as const,
  }
}

export const auth = createSaplingAuth(authConfig)

// Pre-configured middleware with our config
export const authMiddleware = baseAuthMiddleware(authConfig)
export const optionalAuthMiddleware = baseOptionalAuthMiddleware(authConfig)

// Export utility functions
export { getUser, requireUser } from '@sapling/auth'