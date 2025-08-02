# @sapling/auth

⚠️ **Experimental** - This package is in early development and not ready for production use.

A simple OAuth authentication library for Hono applications with support for Google and GitHub providers.

## Features

- OAuth 2.0 authentication with Google and GitHub
- JWT-based access tokens with refresh token support
- Configurable cookie options for security
- Database adapter pattern for flexible storage
- Built-in CSRF protection
- TypeScript support

## Installation

```bash
deno add @sapling/auth
```

## Quick Start

```typescript
import { createSaplingAuth, authMiddleware } from '@sapling/auth'
import { Hono } from 'hono'

const app = new Hono()

// Configure your database adapter
const database = {
  findUser: async (providerId, provider) => { /* implementation */ },
  createUser: async (userData) => { /* implementation */ },
  updateUser: async (id, data) => { /* implementation */ },
  createRefreshToken: async (userId, token) => { /* implementation */ },
  validateRefreshToken: async (token) => { /* implementation */ },
  revokeRefreshToken: async (token) => { /* implementation */ }
}

// Create auth routes
const auth = createSaplingAuth({
  jwtSecret: 'your-secret-key',
  providers: {
    google: {
      clientId: 'your-google-client-id',
      clientSecret: 'your-google-client-secret',
      redirectUri: 'http://localhost:3000/auth/google/callback'
    },
    github: {
      clientId: 'your-github-client-id',
      clientSecret: 'your-github-client-secret',
      redirectUri: 'http://localhost:3000/auth/github/callback'
    }
  },
  database
})

// Mount auth routes
app.route('/auth', auth)

// Protected routes
app.use('/protected/*', authMiddleware({ jwtSecret: 'your-secret-key' }))
app.get('/protected/profile', (c) => {
  const user = c.get('user')
  return c.json({ userId: user.userId })
})

export default app
```

## Authentication Flow

1. Visit `/auth/google` or `/auth/github` to start OAuth flow
2. User is redirected to provider for authentication
3. Provider redirects back to `/auth/{provider}/callback`
4. Access token (15 min) and refresh token (7 days) are set as HTTP-only cookies
5. Use `/auth/refresh` to get new access tokens
6. Use `/auth/logout` to clear tokens

## Database Adapter

Implement the `DatabaseAdapter` interface to store users and refresh tokens in your preferred database.

## License

MIT