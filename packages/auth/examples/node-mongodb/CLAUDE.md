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

## Environment Variables

Required environment variables:
- `MONGODB_URI`: MongoDB connection string (defaults to "mongodb://localhost:27017")
- `DATABASE_NAME`: MongoDB database name (defaults to "sapling_auth")
- OAuth provider credentials (Google/GitHub client IDs and secrets)

## Architecture Overview

This is a Sapling authentication example application built with:

**Core Technologies:**
- **Hono**: Web framework for the server (src/index.tsx)
- **Sapling**: Component framework for SSR with islands architecture
- **MongoDB**: Document database for user and token storage
- **TypeScript**: Full TypeScript implementation
- **Tailwind CSS**: Utility-first CSS framework

**Key Architecture Patterns:**

1. **Server-Side Rendering with Islands**: Uses Sapling framework for SSR with selective client-side hydration via `<sapling-island>` components

2. **MongoDB Integration**: Uses native MongoDB driver for data persistence:
   - User authentication data stored in `users` collection
   - Refresh tokens stored in `tokens` collection with automatic expiration
   - Indexes created automatically for optimal query performance

3. **Authentication Flow**: OAuth-based authentication with refresh token support:
   - Supports Google and GitHub OAuth providers
   - JWT-based session management with refresh token rotation
   - Database adapter pattern for flexible data layer

**File Structure:**
- `src/index.tsx`: Main server entry point with Hono routes and auth configuration
- `src/auth/database-adapter.ts`: MongoDB database adapter implementation
- `src/auth/index.ts`: Authentication service configuration
- `src/db/db.ts`: MongoDB connection and database setup
- `src/db/schema.ts`: TypeScript interfaces for MongoDB documents
- `src/layouts/Layout.tsx`: Base layout wrapper using Sapling
- `src/pages/`: Application pages (Home, Login)
- `src/components/`: Reusable UI components

**Database Schema:**
- **Users Collection**: Stores user profiles with OAuth provider IDs
- **Tokens Collection**: Manages refresh tokens with automatic expiration

**Key Features:**
- OAuth authentication (Google/GitHub)
- JWT-based sessions with refresh token rotation
- MongoDB document storage with proper indexing
- Type-safe database operations
- Automatic token cleanup via MongoDB TTL indexes

The application demonstrates authentication patterns with Sapling SSR, MongoDB integration, and secure session management.