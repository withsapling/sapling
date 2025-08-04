# Sapling Auth Server - Standalone Example

A standalone authentication server API designed for mobile apps, CLI tools, and other client applications that need JSON-based authentication. This server handles OAuth complexity and provides simple JSON endpoints for authentication status and user information.

## Features

- 🔐 **Google OAuth Integration** - Secure authentication via Google
- 📱 **Mobile-First API** - JSON responses perfect for mobile apps and CLI tools
- 🔒 **Secure Session Management** - HTTP-only cookies with JWT tokens
- 🗄️ **PostgreSQL Database** - Persistent user data with Drizzle ORM
- ⚡ **Lightweight & Fast** - Built with Hono framework
- 🛡️ **Security Best Practices** - CSRF protection, secure cookies, environment-based config

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials

### Setup

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/authdb"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
BASE_URL="http://localhost:8080"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Environment
ENV="development"
```

3. **Set up the database:**
```bash
npm run db:push
```

4. **Start the development server:**
```bash
npm run dev
```

The server will be available at `http://localhost:8080`

## API Reference

### Authentication Endpoints

#### `GET /auth/google`
Initiates Google OAuth flow. Redirects user to Google's consent screen.

**Usage:** Direct users to this endpoint in a browser or embedded web view.

#### `GET /auth/google/callback`
Handles Google OAuth callback. Sets authentication cookies and redirects to `/api/user`.

#### `POST /auth/logout`
Logs out the user and clears authentication cookies.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### User Data Endpoints

#### `GET /api/user`
Returns authenticated user information. **Requires authentication.**

**Response (authenticated):**
```json
{
  "success": true,
  "user": {
    "id": "user_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Response (unauthenticated):**
```json
{
  "error": "Unauthorized"
}
```
*Status: 401*

#### `GET /api/status`
Check authentication status. Works for both authenticated and unauthenticated users.

**Response (authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "user_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Response (unauthenticated):**
```json
{
  "authenticated": false,
  "user": null
}
```

### Utility Endpoints

#### `GET /health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-08-04T12:00:00.000Z"
}
```

## Usage Examples

### Mobile App (React Native)

```javascript
// Check authentication status
const checkAuth = async () => {
  const response = await fetch('http://localhost:8080/api/status', {
    credentials: 'include' // Important: include cookies
  });
  const data = await response.json();
  return data.authenticated;
};

// Get user info
const getUser = async () => {
  const response = await fetch('http://localhost:8080/api/user', {
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Not authenticated');
};

// Login (open OAuth URL in WebView)
const loginUrl = 'http://localhost:8080/auth/google';
```

### CLI Tool (Node.js)

```javascript
import fetch from 'node-fetch';

// For CLI tools, you'll need to handle the OAuth flow
// by opening a browser and capturing the callback
const checkStatus = async () => {
  const response = await fetch('http://localhost:8080/api/status');
  const data = await response.json();
  console.log(data.authenticated ? 'Logged in' : 'Not logged in');
};
```

### cURL Examples

```bash
# Check authentication status
curl -c cookies.txt http://localhost:8080/api/status

# Get user info (after authentication)
curl -b cookies.txt http://localhost:8080/api/user

# Logout
curl -X POST -b cookies.txt http://localhost:8080/auth/logout
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

### Project Structure

```
src/
├── auth/
│   ├── index.ts              # Auth configuration
│   └── database-adapter.ts   # Database adapter for auth
├── db/
│   ├── db.ts                # Database connection
│   └── schema.ts            # Database schema
└── index.tsx                # Main server file
```

## Deployment

### Environment Variables for Production

```env
ENV="production"
BASE_URL="https://your-domain.com"
DATABASE_URL="your-production-database-url"
# ... other vars
```

### Build and Deploy

```bash
npm run build
npm start
```

The built application will be in the `dist/` directory.

## Security Considerations

- Uses HTTP-only cookies to prevent XSS attacks
- Implements CSRF protection via SameSite cookie policy
- JWT secrets should be cryptographically strong
- Database connections should use SSL in production
- OAuth redirect URIs must be whitelisted in Google Console

## Troubleshooting

### Common Issues

1. **"Unauthorized" responses**: Check that cookies are being sent with requests (`credentials: 'include'`)
2. **OAuth errors**: Verify Google Client ID/Secret and redirect URI configuration
3. **Database connection errors**: Ensure PostgreSQL is running and DATABASE_URL is correct
4. **CORS issues**: The server doesn't set CORS headers by default - add them if needed for browser requests from different origins
