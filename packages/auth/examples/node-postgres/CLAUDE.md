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

This is a real-time chat application built with:

**Core Technologies:**
- **Hono**: Web framework for the server (src/index.tsx)
- **Sapling**: Component framework for SSR with islands architecture
- **Google Generative AI**: AI service integration for chat responses with grounding/search
- **TypeScript**: Full TypeScript implementation
- **Tailwind CSS**: Utility-first CSS framework with custom animations

**Key Architecture Patterns:**

1. **Server-Side Rendering with Islands**: Uses Sapling framework for SSR with selective client-side hydration via `<sapling-island>` components that auto-initialize when loaded

2. **Real-time Streaming**: Implements Server-Sent Events (SSE) for streaming AI responses:
   - Chat messages trigger SSE streams at `/chat/stream/:sessionId`
   - Client-side JavaScript handles progressive content updates with proper loading indicators
   - Markdown rendering with `marked.js` library (when available)

3. **Pure Client-Side JavaScript**: No HTMX - uses vanilla JavaScript with event-driven architecture:
   - Custom event system for component communication (`chatSubmit` events)
   - Form submissions prevented and handled via JavaScript
   - Sapling islands auto-initialize components without DOMContentLoaded

4. **Session Management**: Persistent chat sessions with conversation history:
   - Each chat instance maintains a unique session ID
   - AI service handles session-based context preservation
   - In-memory session storage (not persistent across server restarts)

**File Structure:**
- `src/index.tsx`: Main server entry point with Hono routes
- `src/services/ai.ts`: Google AI integration with streaming support and session management
- `src/layouts/Layout.tsx`: Base layout wrapper using Sapling
- `src/pages/Home.tsx`: Simplified to just render the Chat component
- `src/components/Chat.tsx`: Main chat component with welcome screen and chat interface
- `src/components/ChatInput.tsx`: Reusable input component with event dispatching
- `static/components/Chat.js`: Full chat functionality with SSE streaming and message management
- `static/components/ChatInput.js`: Form handling and event dispatching logic

**API Endpoints:**
- `GET /`: Home page (renders Chat component)
- `POST /api/chat`: Optional non-streaming API endpoint
- `GET /chat/stream/:sessionId`: SSE endpoint for streaming AI responses with session persistence

**Environment Requirements:**
- Requires Google AI API credentials (configured via environment variables)
- Uses dotenv for environment variable management

**UI Behavior:**
- Initially shows welcome screen with floating input
- Transitions to chat view after first message with smooth animations
- Real-time typing indicators with animated dots (using custom Tailwind animations)
- Progressive message rendering as AI responses stream in
- Auto-scrolling chat interface with proper message formatting
- Input clearing and button state management
- Conversation history maintained within each chat session

**Component Architecture:**
- **Chat Component**: Main container handling view transitions, message management, and SSE streaming
- **ChatInput Component**: Reusable form component with event-driven communication
- **Event System**: Uses `chatSubmit` custom events for loose coupling between components
- **Sapling Islands**: Components auto-initialize immediately when scripts load (no DOMContentLoaded needed)

**Key Features:**
- Google Search grounding for AI responses with real-world information
- Persistent conversation context within sessions
- Smooth loading states with proper visual feedback
- Responsive design with mobile-friendly interface
- Error handling and connection recovery for SSE streams

The application demonstrates modern web patterns with SSR, islands architecture, real-time streaming, and event-driven client-side JavaScript while maintaining clean separation of concerns.