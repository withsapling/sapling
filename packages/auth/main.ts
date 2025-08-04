import { type Context, Hono, type MiddlewareHandler, type Next } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

// Extend Hono's context to include our user type
declare module 'hono' {
  interface ContextVariableMap {
    user: User
  }
}

export interface SaplingAuthConfig {
  jwtSecret: string
  google?: GoogleProvider
  github?: GitHubProvider
  database?: DatabaseAdapter
  baseUrl?: string
  redirects?: {
    success?: string
    failure?: string
  }
  cookieOptions?: {
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    maxAge?: number
  }
}

export interface GoogleProvider {
  clientId: string
  clientSecret: string
  redirectUri?: string
  scopes?: string[]
}

export interface GitHubProvider {
  clientId: string
  clientSecret: string
  redirectUri?: string
  scopes?: string[]
}

export interface DatabaseAdapter {
  findUser: (providerId: string, provider: string) => Promise<User | null>
  createUser: (userData: CreateUserData) => Promise<User>
  updateUser: (id: string, data: Partial<User>) => Promise<User>
  createRefreshToken: (userId: string, token: string) => Promise<void>
  validateRefreshToken: (token: string) => Promise<{ userId: string } | null>
  revokeRefreshToken: (token: string) => Promise<void>
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface CreateUserData {
  email: string
  name: string
  avatar?: string
  providerId: string
  provider: string
}

// Simple in-memory database for prototyping
class InMemoryDatabase implements DatabaseAdapter {
  private users = new Map<string, User>()
  private tokens = new Map<string, { userId: string; expiresAt: Date; revokedAt?: Date }>()
  
  async findUser(providerId: string, provider: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if ((user as any)[`${provider}Id`] === providerId) {
        return user
      }
    }
    return null
  }
  
  async createUser(userData: CreateUserData): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      ...{ [`${userData.provider}Id`]: userData.providerId }
    }
    this.users.set(user.id, user)
    return user
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = this.users.get(id)
    if (!user) throw new Error('User not found')
    const updated = { ...user, ...data }
    this.users.set(id, updated)
    return updated
  }
  
  async createRefreshToken(userId: string, token: string): Promise<void> {
    this.tokens.set(token, {
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
  }
  
  async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
    const tokenData = this.tokens.get(token)
    if (!tokenData || tokenData.expiresAt < new Date() || tokenData.revokedAt) {
      return null
    }
    return { userId: tokenData.userId }
  }
  
  async revokeRefreshToken(token: string): Promise<void> {
    const tokenData = this.tokens.get(token)
    if (tokenData) {
      tokenData.revokedAt = new Date()
    }
  }
}

export function createSaplingAuth(config: SaplingAuthConfig): Hono {
  const app = new Hono()
  
  // Set up defaults
  const database = config.database || new InMemoryDatabase()
  const baseUrl = config.baseUrl || 'http://localhost:8080'
  const redirects = {
    success: config.redirects?.success || '/dashboard',
    failure: config.redirects?.failure || '/login'
  }
  
  // Auto-generate redirect URIs if not provided
  if (config.google && !config.google.redirectUri) {
    config.google.redirectUri = `${baseUrl}/auth/google/callback`
  }
  if (config.github && !config.github.redirectUri) {
    config.github.redirectUri = `${baseUrl}/auth/github/callback`
  }

  // OAuth initiation endpoints
  app.get('/google', async (c) => {
    if (!config.google) {
      return c.json({ error: 'Google OAuth not configured' }, 400)
    }
    
    const { clientId, redirectUri, scopes } = config.google
    const state = crypto.randomUUID()
    
    // Store state in session/cookie for CSRF protection
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: config.cookieOptions?.secure ?? true,
      maxAge: 600 // 10 minutes
    })
    
    // Default scopes if none provided
    const requestedScopes = scopes && scopes.length > 0 
      ? scopes.join(' ')
      : 'openid email profile'
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri!)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', requestedScopes)
    authUrl.searchParams.set('state', state)
    
    return c.redirect(authUrl.toString())
  })

  app.get('/github', async (c) => {
    if (!config.github) {
      return c.json({ error: 'GitHub OAuth not configured' }, 400)
    }
    
    const { clientId, redirectUri, scopes } = config.github
    const state = crypto.randomUUID()
    
    // Store state in session/cookie for CSRF protection
    setCookie(c, 'oauth_state', state, {
      httpOnly: true,
      secure: config.cookieOptions?.secure ?? true,
      maxAge: 600 // 10 minutes
    })
    
    // Default scopes if none provided
    const requestedScopes = scopes && scopes.length > 0 
      ? scopes.join(' ')
      : 'user:email'
    
    const authUrl = new URL('https://github.com/login/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri!)
    authUrl.searchParams.set('scope', requestedScopes)
    authUrl.searchParams.set('state', state)
    
    return c.redirect(authUrl.toString())
  })

  // OAuth callback endpoints
  app.get('/google/callback', async (c) => {
    if (!config.google) {
      return c.json({ error: 'Google OAuth not configured' }, 400)
    }

    const code = c.req.query('code')
    const state = c.req.query('state')
    const storedState = getCookie(c, 'oauth_state')

    if (!code || !state || state !== storedState) {
      return c.json({ error: 'Invalid OAuth callback' }, 400)
    }

    // Clear state cookie
    deleteCookie(c, 'oauth_state')

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.google.redirectUri!
        })
      })

      const tokens = await tokenResponse.json()
      
      if (!tokens.access_token) {
        return c.json({ error: 'Failed to get access token' }, 400)
      }

      // Get user info
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      })

      const googleUser = await userResponse.json()

      // Find or create user
      let user = await database.findUser(googleUser.id, 'google')
      
      if (!user) {
        user = await database.createUser({
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          providerId: googleUser.id,
          provider: 'google'
        })
      }

      // Create tokens
      const accessToken = await sign(
        { 
          userId: user.id, 
          exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        }, 
        config.jwtSecret
      )

      const refreshToken = crypto.randomUUID()
      await database.createRefreshToken(user.id, refreshToken)

      // Set cookies
      setCookie(c, 'auth_token', accessToken, {
        httpOnly: true,
        secure: config.cookieOptions?.secure ?? true,
        sameSite: config.cookieOptions?.sameSite ?? 'lax',
        maxAge: 15 * 60 // 15 minutes
      })

      setCookie(c, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: config.cookieOptions?.secure ?? true,
        sameSite: config.cookieOptions?.sameSite ?? 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      // Check if client wants JSON response (mobile/API)
      const acceptHeader = c.req.header('Accept') || ''
      if (acceptHeader.includes('application/json')) {
        return c.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          },
          accessToken,
          refreshToken
        })
      }

      return c.redirect(redirects.success)

    } catch (error) {
      console.error('OAuth callback error:', error)
      return c.json({ error: 'Authentication failed' }, 500)
    }
  })

  app.get('/github/callback', async (c) => {
    if (!config.github) {
      return c.json({ error: 'GitHub OAuth not configured' }, 400)
    }

    const code = c.req.query('code')
    const state = c.req.query('state')
    const storedState = getCookie(c, 'oauth_state')

    if (!code || !state || state !== storedState) {
      return c.json({ error: 'Invalid OAuth callback' }, 400)
    }

    // Clear state cookie
    deleteCookie(c, 'oauth_state')

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: config.github.clientId,
          client_secret: config.github.clientSecret,
          code,
          redirect_uri: config.github.redirectUri!
        })
      })

      const tokens = await tokenResponse.json()
      
      if (!tokens.access_token) {
        return c.json({ error: 'Failed to get access token' }, 400)
      }

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: { 
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'SaplingAuth'
        }
      })

      const githubUser = await userResponse.json()

      // Get user email (might be private)
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: { 
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'SaplingAuth'
        }
      })

      const emails = await emailResponse.json()
      const primaryEmail = emails.find((email: any) => email.primary)?.email || githubUser.email

      // Find or create user
      let user = await database.findUser(githubUser.id.toString(), 'github')
      
      if (!user) {
        user = await database.createUser({
          email: primaryEmail,
          name: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          providerId: githubUser.id.toString(),
          provider: 'github'
        })
      }

      // Create tokens
      const accessToken = await sign(
        { 
          userId: user.id, 
          exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
        }, 
        config.jwtSecret
      )

      const refreshToken = crypto.randomUUID()
      await database.createRefreshToken(user.id, refreshToken)

      // Set cookies
      setCookie(c, 'auth_token', accessToken, {
        httpOnly: true,
        secure: config.cookieOptions?.secure ?? true,
        sameSite: config.cookieOptions?.sameSite ?? 'lax',
        maxAge: 15 * 60 // 15 minutes
      })

      setCookie(c, 'refresh_token', refreshToken, {
        httpOnly: true,
        secure: config.cookieOptions?.secure ?? true,
        sameSite: config.cookieOptions?.sameSite ?? 'lax',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      // Check if client wants JSON response (mobile/API)
      const acceptHeader = c.req.header('Accept') || ''
      if (acceptHeader.includes('application/json')) {
        return c.json({ 
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          },
          accessToken,
          refreshToken
        })
      }

      return c.redirect(redirects.success)

    } catch (error) {
      console.error('GitHub OAuth callback error:', error)
      return c.json({ error: 'Authentication failed' }, 500)
    }
  })

  // Token refresh endpoint
  app.post('/refresh', async (c) => {
    const refreshToken = getCookie(c, 'refresh_token')
    
    if (!refreshToken) {
      return c.json({ error: 'No refresh token' }, 401)
    }

    const tokenData = await database.validateRefreshToken(refreshToken)
    
    if (!tokenData) {
      return c.json({ error: 'Invalid refresh token' }, 401)
    }

    // Create new access token
    const accessToken = await sign(
      { 
        userId: tokenData.userId, 
        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
      }, 
      config.jwtSecret
    )

    setCookie(c, 'auth_token', accessToken, {
      httpOnly: true,
      secure: config.cookieOptions?.secure ?? true,
      sameSite: config.cookieOptions?.sameSite ?? 'lax',
      maxAge: 15 * 60
    })

    return c.json({ success: true })
  })

  // Logout endpoint
  app.post('/logout', async (c) => {
    const refreshToken = getCookie(c, 'refresh_token')
    
    if (refreshToken) {
      await database.revokeRefreshToken(refreshToken)
    }

    deleteCookie(c, 'auth_token')
    deleteCookie(c, 'refresh_token')

    return c.json({ success: true })
  })

  return app
}

// Extended auth middleware with automatic token refresh
export function authMiddleware(config: Pick<SaplingAuthConfig, 'jwtSecret' | 'database' | 'cookieOptions'>): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const database = config.database || new InMemoryDatabase()
    const token = getCookie(c, 'auth_token')
    let user: User | null = null

    // Try to verify existing token
    if (token) {
      try {
        const payload = await verify(token, config.jwtSecret)
        // Get full user object from database
        const foundUser = await database.findUser(payload.userId as string, 'google') ||
                          await database.findUser(payload.userId as string, 'github')
        if (foundUser) {
          user = foundUser
        }
      } catch (_error) {
        // Token invalid/expired, will try refresh below
      }
    }

    // If no valid token, try to refresh
    if (!user) {
      const refreshToken = getCookie(c, 'refresh_token')
      if (refreshToken) {
        const tokenData = await database.validateRefreshToken(refreshToken)
        if (tokenData) {
          // Create new access token
          const newAccessToken = await sign(
            { 
              userId: tokenData.userId, 
              exp: Math.floor(Date.now() / 1000) + (15 * 60)
            }, 
            config.jwtSecret
          )

          setCookie(c, 'auth_token', newAccessToken, {
            httpOnly: true,
            secure: config.cookieOptions?.secure ?? true,
            sameSite: config.cookieOptions?.sameSite ?? 'lax',
            maxAge: 15 * 60
          })

          // Get user
          const foundUser = await database.findUser(tokenData.userId, 'google') ||
                            await database.findUser(tokenData.userId, 'github')
          if (foundUser) {
            user = foundUser
          }
        }
      }
    }

    if (!user) {
      const accept = c.req.header('Accept') || ''
      if (accept.includes('application/json')) {
        return c.json({ error: 'Authentication required' }, 401)
      }
      return c.redirect('/login')
    }

    c.set('user', user)
    await next()
  }
}

// Optional auth middleware (doesn't redirect/error if not authenticated)
export function optionalAuthMiddleware(config: Pick<SaplingAuthConfig, 'jwtSecret' | 'database' | 'cookieOptions'>): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const database = config.database || new InMemoryDatabase()
    const token = getCookie(c, 'auth_token')
    let user: User | null = null

    if (token) {
      try {
        const payload = await verify(token, config.jwtSecret)
        const foundUser = await database.findUser(payload.userId as string, 'google') ||
                          await database.findUser(payload.userId as string, 'github')
        if (foundUser) {
          user = foundUser
        }
      } catch (_error) {
        // Try refresh
        const refreshToken = getCookie(c, 'refresh_token')
        if (refreshToken) {
          const tokenData = await database.validateRefreshToken(refreshToken)
          if (tokenData) {
            const newAccessToken = await sign(
              { 
                userId: tokenData.userId, 
                exp: Math.floor(Date.now() / 1000) + (15 * 60)
              }, 
              config.jwtSecret
            )

            setCookie(c, 'auth_token', newAccessToken, {
              httpOnly: true,
              secure: config.cookieOptions?.secure ?? true,
              sameSite: config.cookieOptions?.sameSite ?? 'lax',
              maxAge: 15 * 60
            })

            const foundUser = await database.findUser(tokenData.userId, 'google') ||
                              await database.findUser(tokenData.userId, 'github')
            if (foundUser) {
              user = foundUser
            }
          }
        }
      }
    }

    if (user) {
      c.set('user', user)
    }
    
    await next()
  }
}

// Utility function to get authenticated user from context
export function getUser(c: Context): User | null {
  return c.get('user') || null
}

// Utility function to require authentication (throws if not authenticated)
export function requireUser(c: Context): User {
  const user = c.get('user')
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}