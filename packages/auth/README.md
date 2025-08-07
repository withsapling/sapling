# @sapling/auth

The easiest OAuth implementation for Hono. Add Google and GitHub authentication to your app with minimal configuration.

## Features

- **🚀 Minimal Setup** - Get OAuth working in 3 lines of code
- **📱 Mobile Ready** - Automatic JSON responses for mobile/API clients
- **🔒 Secure by Default** - JWT tokens, refresh tokens, CSRF protection
- **🎨 Database Flexible** - Bring your own database adapter (Postgres, MongoDB, etc.)
- **⚡ Auto-Refresh** - Automatic token refresh with built-in middleware
- **🛡️ Optional Auth** - Optional authentication middleware for flexible route protection

## Installation

**For Deno projects:**
```bash
deno add jsr:@sapling/auth
```

**For Node.js projects:**
```bash
npx jsr add @sapling/auth
```

## Quick Start

```typescript
import { createSaplingAuth, authMiddleware } from '@sapling/auth'
import { createDatabaseAdapter } from './database-adapter.js'

// 1. Create auth routes with your database adapter
const auth = createSaplingAuth({
  jwtSecret: process.env.JWT_SECRET!,
  database: createDatabaseAdapter(), // Required: your database adapter
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!
  }
})

// 2. Mount auth routes
app.route('/auth', auth)

// 3. Protect routes with middleware
app.get('/dashboard', authMiddleware({ 
  jwtSecret: process.env.JWT_SECRET!,
  database: createDatabaseAdapter()
}), (c) => {
  const user = c.get('user') // Full user object available
  return c.json({ user })
})
```

That's it! Your app now has:
- `/auth/google` - Google OAuth login
- `/auth/google/callback` - OAuth callback
- `/auth/github` - GitHub OAuth login
- `/auth/github/callback` - GitHub OAuth callback
- `/auth/refresh` - Token refresh endpoint  
- `/auth/logout` - Logout endpoint

## Database Setup

Sapling Auth requires a database adapter to store users and refresh tokens. Here's a complete example using Postgres with Drizzle ORM:

### Database Schema

```typescript
// db/schema.ts
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  token: varchar('token', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Database Adapter

```typescript
// auth/database-adapter.ts
import { eq, and } from 'drizzle-orm'
import { db } from '../db/db.js'
import { users, refreshTokens } from '../db/schema.js'
import type { DatabaseAdapter, User, CreateUserData } from '@sapling/auth'

export function createDatabaseAdapter(): DatabaseAdapter {
  return {
    async findUser(providerId: string, provider: string): Promise<User | null> {
      const result = await db
        .select()
        .from(users)
        .where(and(eq(users.providerId, providerId), eq(users.provider, provider)))
        .limit(1)

      return result[0] || null
    },

    async createUser(userData: CreateUserData): Promise<User> {
      const id = crypto.randomUUID()
      const result = await db
        .insert(users)
        .values({ 
          id, 
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()

      return result[0]
    },

    async updateUser(id: string, data: Partial<User>): Promise<User> {
      const result = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning()

      return result[0]
    },

    async createRefreshToken(userId: string, token: string): Promise<void> {
      await db.insert(refreshTokens).values({
        token,
        userId,
        createdAt: new Date()
      })
    },

    async validateRefreshToken(token: string): Promise<{ userId: string } | null> {
      const result = await db
        .select({ userId: refreshTokens.userId })
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token))
        .limit(1)

      return result[0] || null
    },

    async revokeRefreshToken(token: string): Promise<void> {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, token))
    }
  }
}
```

## Configuration

### Basic Configuration

```typescript
const auth = createSaplingAuth({
  jwtSecret: 'your-secret-key',
  database: createDatabaseAdapter(), // Required
  
  // Enable Google OAuth
  google: {
    clientId: 'your-google-client-id',
    clientSecret: 'your-google-client-secret'
    // redirectUri auto-generated from baseUrl
  },
  
  // Enable GitHub OAuth
  github: {
    clientId: 'your-github-client-id', 
    clientSecret: 'your-github-client-secret'
  }
})
```

### Advanced Configuration

```typescript
const auth = createSaplingAuth({
  jwtSecret: process.env.JWT_SECRET!,
  database: createDatabaseAdapter(),
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'https://myapp.com/auth/google/callback', // Custom redirect
    scopes: ['openid', 'email', 'profile'] // Custom scopes
  },
  
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    scopes: ['user:email'] // Custom scopes
  },
  
  // Custom URLs (optional)
  baseUrl: 'https://myapp.com',
  redirects: {
    success: '/dashboard', // Where to redirect after login
    failure: '/login'      // Where to redirect on auth failure
  },
  
  // Cookie options (optional)
  cookieOptions: {
    secure: true,
    sameSite: 'lax',
    httpOnly: true
  }
})
```

## Mobile App Support

Sapling Auth automatically detects mobile/API clients and returns JSON responses instead of redirects.

### Mobile OAuth Flow

1. **Start OAuth:** Direct users to `/auth/google`
2. **Handle Callback:** Set `Accept: application/json` header
3. **Receive Tokens:** Get JSON response with user data and tokens

```typescript
// Mobile client example
const response = await fetch('/auth/google/callback?code=...&state=...', {
  headers: {
    'Accept': 'application/json'
  }
})

const { success, user, accessToken, refreshToken } = await response.json()
// Store tokens for API requests
```

## Middleware Options

### Required Authentication

Use `authMiddleware` to require authentication for routes:

```typescript
import { authMiddleware } from '@sapling/auth'

app.get('/protected', authMiddleware({
  jwtSecret: process.env.JWT_SECRET!,
  database: createDatabaseAdapter()
}), (c) => {
  const user = c.get('user') // Always available here
  return c.json({ user })
})
```

### Optional Authentication

Use `optionalAuthMiddleware` when you want to check for authentication but not require it:

```typescript
import { optionalAuthMiddleware, getUser } from '@sapling/auth'

app.get('/public', optionalAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET!,
  database: createDatabaseAdapter()
}), (c) => {
  const user = getUser(c) // May be null
  if (user) {
    return c.json({ message: `Welcome back, ${user.name}!` })
  }
  return c.json({ message: 'Welcome, anonymous user!' })
})
```

## Utility Functions

```typescript
import { getUser, requireUser } from '@sapling/auth'

app.get('/profile', optionalAuthMiddleware(config), (c) => {
  // Get user if authenticated, null if not
  const user = getUser(c)
  
  // Or require user (throws error if not authenticated)
  try {
    const user = requireUser(c)
    return c.json({ user })
  } catch (error) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
})
```

## TypeScript Support

Full TypeScript support with proper type inference:

```typescript
import type { User, DatabaseAdapter, CreateUserData } from '@sapling/auth'

app.get('/profile', authMiddleware(config), (c) => {
  const user = c.get('user') // Typed as User
  return c.json({ 
    id: user.id,     // ✅ TypeScript knows these exist
    name: user.name,
    email: user.email,
    avatar: user.avatar
  })
})
```

## Examples

Check out the complete working examples in the `/examples` directory:

- **[Node.js + PostgreSQL](/examples/node-postgres/)** - Full-stack app with Postgres database
- **[Node.js + MongoDB](/examples/node-mongodb/)** - Full-stack app with MongoDB database
- **[Node.js + Postgres Standalone](/examples/node-postgres-standalone/)** - Minimal API-only setup

Each example includes:
- Complete database setup with migrations
- Environment variable configuration
- Production-ready deployment setup
- Both web and API authentication flows

## License

MIT