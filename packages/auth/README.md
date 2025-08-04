# @sapling/auth

The easiest OAuth implementation for Hono. Add Google and GitHub authentication to your app with minimal configuration.

## Features

- **🚀 Minimal Setup** - Get OAuth working in 3 lines of code
- **📱 Mobile Ready** - Automatic JSON responses for mobile/API clients
- **🔒 Secure by Default** - JWT tokens, refresh tokens, CSRF protection
- **🎨 Flexible** - Bring your own database or use built-in in-memory storage
- **⚡ Auto-Refresh** - Automatic token refresh with built-in middleware

## Installation

```bash
deno add @sapling/auth
```

## Quick Start

```typescript
import { createSaplingAuth, authMiddleware } from '@sapling/auth'

// 1. Create auth routes with minimal config
const auth = createSaplingAuth({
  jwtSecret: process.env.JWT_SECRET!,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!
  }
})

// 2. Mount auth routes
app.route('/auth', auth)

// 3. Protect routes with middleware
app.get('/dashboard', authMiddleware({ jwtSecret: process.env.JWT_SECRET! }), (c) => {
  const user = c.get('user') // Full user object available
  return c.json({ user })
})
```

That's it! Your app now has:
- `/auth/google` - Google OAuth login
- `/auth/google/callback` - OAuth callback
- `/auth/refresh` - Token refresh endpoint  
- `/auth/logout` - Logout endpoint

## Configuration

### Basic Configuration

```typescript
const auth = createSaplingAuth({
  jwtSecret: 'your-secret-key',
  
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
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: 'https://myapp.com/auth/google/callback', // Custom redirect
    scopes: ['openid', 'email', 'profile'] // Custom scopes
  },
  
  // Custom database (optional - defaults to in-memory)
  database: myDatabaseAdapter,
  
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

## TypeScript Support

Full TypeScript support with proper type inference:

```typescript
import type { User } from '@sapling/auth'

app.get('/profile', authMiddleware(config), (c) => {
  const user = c.get('user') // Typed as User
  return c.json({ 
    id: user.id,     // ✅ TypeScript knows these exist
    name: user.name,
    email: user.email
  })
})
```

## License

MIT