# @sapling/auth Example - In-Memory Storage

This example demonstrates the **simplest possible setup** with `@sapling/auth` - using the built-in in-memory database for instant prototyping without any external dependencies.

Perfect for:
- 🚀 **Quick prototyping** - Get OAuth working in minutes
- 🧪 **Testing and development** - No database setup required  
- 📚 **Learning** - Focus on OAuth flow without infrastructure complexity

## Features Demonstrated

- **Minimal configuration** (just 3 required fields)
- **Built-in in-memory database** (no external dependencies)
- **Auto-generated redirect URIs**
- **Google OAuth integration**
- **Protected routes with middleware**
- **Automatic token refresh**

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Google OAuth credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:8080
   ```

## Key Files

- **`src/auth/index.ts`** - Minimal auth configuration (only ~20 lines!)
- **`src/index.tsx`** - Main app with protected routes
- **`src/pages/Login.tsx`** - Simple login page
- **`src/pages/Home.tsx`** - Protected home page

## Configuration

The entire auth setup is just:

```typescript
const authConfig = {
  jwtSecret: process.env.JWT_SECRET!,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!
  }
  // That's it! In-memory database is used automatically
}
```

## Environment Variables

```bash
# Required
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id  
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Optional
BASE_URL=http://localhost:8080  # For auto-generating redirect URIs
```

## OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:8080/auth/google/callback`
4. Copy Client ID and Client Secret to `.env`

## Production Notes

⚠️ **In-memory storage is not persistent!** 
- Users and tokens are lost on server restart
- For production, use the [node-postgres example](../node-postgres/) with a real database

## Next Steps

- Try the [node-postgres example](../node-postgres/) for production-ready database integration
- Add GitHub OAuth by including a `github` config
- Customize redirects and cookie options
