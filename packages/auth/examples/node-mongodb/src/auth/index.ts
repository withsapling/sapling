import "dotenv/config";
import { createSaplingAuth, authMiddleware as baseAuthMiddleware, optionalAuthMiddleware as baseOptionalAuthMiddleware } from '@sapling/auth'
import { createDatabaseAdapter } from './database-adapter.js'

const authConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // redirectUri auto-generated from baseUrl
  },
  database: createDatabaseAdapter(),
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  redirects: {
    success: '/dashboard',
    failure: '/login'
  },
  cookieOptions: {
    secure: process.env.ENV === 'production',
    sameSite: 'lax',
  }
}

export const auth = createSaplingAuth(authConfig)

// Pre-configured middleware with our config
export const authMiddleware = baseAuthMiddleware(authConfig)
export const optionalAuthMiddleware = baseOptionalAuthMiddleware(authConfig)

// Export utility functions
export { getUser, requireUser } from '@sapling/auth'