# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Starts development server with TypeScript compilation
- **Build**: `npm run build` - Builds TypeScript and copies files to dist/
- **Production**: `npm start` - Runs the built application in production mode
- **Clean**: `npm run clean` - Removes the dist directory

The application runs on http://localhost:8080 by default.

## Architecture Overview

This is a standalone authentication server API designed for mobile apps, CLI tools, and other client applications.

**Core Technologies:**
- **Hono**: Lightweight web framework for the API server (src/index.tsx)
- **Sapling Auth**: Authentication library with Google OAuth integration
- **PostgreSQL**: Database with Drizzle ORM
- **TypeScript**: Full TypeScript implementation

**Key Architecture Patterns:**

1. **JSON API-First**: All endpoints return JSON responses suitable for programmatic consumption:
   - No HTML pages or server-side rendering
   - Consistent JSON error responses
   - RESTful API design patterns

2. **Stateless Authentication**: Uses JWT tokens with HTTP-only cookies:
   - Secure cookie-based session management
   - Configurable cookie options for different environments
   - Token-based user identification

3. **Database Integration**: PostgreSQL with Drizzle ORM:
   - User profile storage
   - Session management
   - OAuth provider integration

**File Structure:**
- `src/index.tsx`: Main API server with JSON endpoints
- `src/auth/index.ts`: Sapling Auth configuration and middleware
- `src/auth/database-adapter.ts`: Database adapter for auth library
- `src/db/`: Database schema and connection setup
- `drizzle/`: Database schema definitions

**API Endpoints:**
- `GET /auth/google`: Initiate Google OAuth flow
- `GET /auth/google/callback`: Google OAuth callback handler
- `POST /auth/logout`: Logout and clear session
- `GET /api/user`: Get authenticated user info (requires auth)
- `GET /api/status`: Check authentication status
- `GET /health`: Health check endpoint

**Environment Requirements:**
- `JWT_SECRET`: Secret for JWT token signing
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `DATABASE_URL`: PostgreSQL connection string
- `BASE_URL`: Base URL for OAuth redirects (default: http://localhost:8080)

**Response Formats:**
All API endpoints return consistent JSON responses:
- User endpoints include: `id`, `email`, `name`, `picture`
- Status endpoint indicates authentication state
- Error responses include descriptive error messages

**Security Features:**
- HTTP-only cookies for session management
- CSRF protection via SameSite cookie policy
- Secure cookie options for production environments
- Environment-based configuration

**Usage Patterns:**
This server is designed to be consumed by:
- Mobile applications needing OAuth authentication
- CLI tools requiring user authentication
- Desktop applications with embedded browsers
- Any client that can handle OAuth flows and cookie-based sessions

The server handles the OAuth complexity and provides simple JSON endpoints for client applications to check authentication status and retrieve user information.