# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Starts development server with CSS watching and TypeScript compilation
- **CSS Development**: `npm run dev:css` - Watches and compiles Tailwind CSS
- **Server Development**: `npm run dev:sapling` - Runs TypeScript server with tsx watch
- **Build**: `npm run build` - Builds CSS and TypeScript, copies static files to dist/
- **Production**: `npm start` - Runs the built application in production mode
- **Clean**: `npm run clean` - Removes the dist directory

The application runs on http://localhost:8080 by default.

## Architecture Overview

This is a minimal authentication example built with:

**Core Technologies:**
- **Hono**: Web framework for the server (src/index.tsx)
- **@sapling/auth**: OAuth authentication with in-memory storage
- **Sapling**: Component framework for SSR
- **TypeScript**: Full TypeScript implementation
- **Tailwind CSS**: Utility-first CSS framework

**Key Features:**

1. **Minimal OAuth Setup**: Demonstrates the simplest possible @sapling/auth configuration
   - Built-in in-memory database (no external dependencies)
   - Auto-generated redirect URIs
   - Only 3 required configuration fields

2. **Authentication Flow**: Complete OAuth implementation with:
   - Google OAuth integration
   - JWT-based access tokens (15 min expiry)
   - Refresh tokens (7 day expiry) 
   - Automatic token refresh via middleware
   - Secure HTTP-only cookies

3. **Route Protection**: Examples of:
   - Protected routes requiring authentication
   - Optional authentication (user context when available)
   - Automatic redirects to login page

**File Structure:**
- `src/index.tsx`: Main server with protected routes
- `src/auth/index.ts`: Minimal auth configuration (~20 lines)
- `src/pages/Login.tsx`: Simple login page with Google OAuth button
- `src/pages/Home.tsx`: Protected home page showing user info
- `src/layouts/Layout.tsx`: Base layout wrapper

**API Endpoints:**
- `GET /`: Protected home page (requires authentication)
- `GET /login`: Login page (redirects if already authenticated)
- `GET /auth/google`: Start Google OAuth flow
- `GET /auth/google/callback`: OAuth callback endpoint
- `POST /auth/refresh`: Token refresh endpoint
- `POST /auth/logout`: Logout and clear tokens

**Environment Requirements:**
- `JWT_SECRET`: Secret key for signing JWT tokens
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- Optional: `BASE_URL` for auto-generating redirect URIs

**Authentication Behavior:**
- Unauthenticated users are redirected to `/login`
- After successful OAuth, users are redirected to home page
- User information is available in route handlers via `c.get('user')`
- Tokens are automatically refreshed when expired
- In-memory storage means users/tokens are lost on server restart

**Key Benefits:**
- Zero database setup required
- Perfect for prototyping and learning
- Complete OAuth flow in minimal code
- Production-ready security patterns
- Easy to upgrade to persistent database later

This example showcases how @sapling/auth makes OAuth authentication incredibly simple while maintaining security best practices.