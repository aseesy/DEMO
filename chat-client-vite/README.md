# LiaiZen Frontend

React + Vite frontend application for the LiaiZen co-parenting platform.

## Overview

The frontend is a Progressive Web App (PWA) built with React 19, Vite, and Tailwind CSS. It provides a real-time messaging interface with AI-powered message mediation, task management, and contact sharing for separated parents.

## Tech Stack

- **React 19** - UI library with hooks and context
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io-client** - WebSocket communication
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **XState** - State machine management
- **DOMPurify** - XSS prevention

## Quick Start

### Prerequisites

- Node.js 20+ (see `engines` in `package.json`)
- npm

### Installation

```bash
cd chat-client-vite
npm install
```

### Environment Variables

Create a `.env` file in the `chat-client-vite/` directory:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

**Production:**
```env
VITE_API_URL=https://your-railway-domain.up.railway.app
VITE_WS_URL=wss://your-railway-domain.up.railway.app
```

### Development

```bash
npm run dev
```

Starts dev server at `http://localhost:5173` with hot module replacement.

### Build

```bash
npm run build
```

Builds for production to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Preview the production build locally.

## Project Structure

```
chat-client-vite/
├── src/
│   ├── features/           # Feature-based organization
│   │   ├── auth/          # Authentication
│   │   ├── chat/          # Chat interface
│   │   ├── invitations/   # Invitation system
│   │   ├── tasks/         # Task management
│   │   ├── contacts/      # Contact management
│   │   ├── pwa/           # PWA features
│   │   └── ...
│   ├── components/        # Shared components
│   ├── context/           # React context providers
│   ├── lib/              # Utility libraries
│   ├── hooks/            # Custom React hooks
│   └── App.jsx           # Root component
├── public/               # Static assets
└── index.html           # HTML entry point
```

## Features

### Real-Time Communication

- WebSocket connection via Socket.io
- Real-time message delivery
- Typing indicators
- Message history
- Thread organization

### AI-Powered Message Mediation

- Real-time message analysis
- Mediation suggestions UI
- Rewrite options
- Communication tips

### Task Management

- Shared task lists
- Task assignments
- Due dates and reminders
- Completion tracking

### Contact Management

- Shared contacts
- Relationship types
- Emergency contacts
- Contact suggestions

### PWA Features

- Service worker for offline support
- Push notifications
- Installable app
- Update management

## Development Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm test             # Run tests
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
npm run test:watch   # Run tests in watch mode
```

## API Integration

The frontend connects to the backend API at `VITE_API_URL`. All API calls use the `/api` prefix.

### Authentication

- JWT tokens stored in httpOnly cookies
- Google OAuth integration
- Password reset flow
- Session management

### WebSocket Connection

Connects to backend WebSocket server at `VITE_WS_URL`. See backend `README.md` for available events.

## Testing

Tests use Vitest and React Testing Library.

```bash
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
```

## Deployment

The frontend is deployed to Vercel. See `docs/deployment.md` for details.

**Production URL**: https://app.coparentliaizen.com

### Vercel Configuration

- **Root Directory**: `chat-client-vite`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Framework Preset**: Other

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Code splitting via Vite
- Lazy loading for routes
- Image optimization
- Service worker caching
- React 19 optimizations

## Security

- XSS prevention via DOMPurify
- Input validation
- Secure WebSocket (WSS) in production
- HTTPS only in production
- Content Security Policy headers

## Additional Resources

- **Main README**: See `/README.md` for project overview
- **Architecture**: See `docs/architecture.md` for system design
- **Backend API**: See `chat-server/README.md` for API documentation
- **Deployment**: See `docs/deployment.md` for deployment guides

---

For questions or issues, see the main project README or open an issue on GitHub.
