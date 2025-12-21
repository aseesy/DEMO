# 💬 Multi-User Chat Room

A production-ready, real-time chat application built with Node.js, Express, Socket.io, and React.

## 🚀 Quick Start

**Want to get started immediately?** See [QUICK_START.md](QUICK_START.md) for a beginner-friendly guide.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Extending the Application](#extending-the-application)
- [License](#license)

## ✨ Features

### Core Functionality

- **Real-time messaging** using WebSocket connections
- **Multiple concurrent users** with live user list
- **Typing indicators** to show when users are composing messages
- **Connection status monitoring** with automatic reconnection
- **Message history** for users joining mid-conversation
- **System notifications** for user join/leave events

### Security Features

- **Input sanitization** to prevent XSS attacks
- **Rate limiting** to prevent spam and DoS attacks
- **CORS protection** with configurable origins
- **Helmet.js security headers** for production hardening
- **Username validation** with length and character restrictions
- **Message length limits** to prevent abuse

### User Experience

- **Beautiful, responsive UI** with Tailwind CSS
- **Color-coded user avatars** for easy identification
- **Auto-scrolling messages** with smooth animations
- **Error handling** with user-friendly messages
- **Mobile-responsive design** for all screen sizes

## 🏗️ Architecture

This application follows a **client-server architecture** with complete separation of concerns:

### Backend (chat-server/)

- **Express.js** HTTP server
- **Socket.io** WebSocket server for real-time communication
- **Event-driven architecture** for scalability
- **In-memory state management** (can be extended to Redis)

### Frontend (chat-client/)

- **React** with functional components and hooks
- **Socket.io client** for WebSocket communication
- **Lucide React** icons for beautiful UI elements
- **Tailwind CSS** for responsive styling

### Communication Flow

```
Client Browser ←→ Socket.io (WebSocket) ←→ Express Server
     ↓                                              ↓
  React UI                                    Event Handlers
     ↓                                              ↓
User Actions                               Business Logic
```

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 📦 Prerequisites

- **Node.js** v14.0.0 or higher
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## 🔧 Installation

### Automatic Setup (Recommended)

**On macOS/Linux:**

```bash
./setup.sh
```

**On Windows:**

```bash
setup.bat
```

### Manual Setup

1. **Install server dependencies:**

```bash
cd chat-server
npm install
```

2. **Install client dependencies:**

```bash
cd chat-client
npm install
```

## 🎯 Usage

You need to run **two separate processes**:

### Terminal 1 - Start the Backend Server

```bash
cd chat-server
npm start
```

You should see:

```
✅ Chat server running on port 3001
   Press Ctrl+C to stop
```

### Terminal 2 - Start the Frontend Client

```bash
cd chat-client
npm start
```

You should see:

```
Starting up http-server, serving ./
Available on:
  http://127.0.0.1:3000
  http://192.168.x.x:3000
```

### Access the Application

Open your browser to: **http://localhost:3000**

### Testing Multi-User Chat

1. Open multiple browser tabs/windows
2. Join with different usernames in each
3. Send messages and watch them appear in real-time!

## 📁 Project Structure

```
chat/
├── chat-server/              # Backend application
│   ├── server.js            # Main server code with Socket.io
│   ├── package.json         # Server dependencies
│   └── .env.example         # Environment variable template
│
├── chat-client/              # Frontend application
│   ├── ChatRoom.jsx         # React component
│   ├── index.html           # HTML wrapper
│   ├── package.json         # Client dependencies
│   └── .env.example         # Environment variable template
│
├── ARCHITECTURE.md           # Detailed architecture documentation
├── QUICK_START.md           # Beginner-friendly guide
├── README.md                # This file
├── setup.sh                 # macOS/Linux setup script
└── setup.bat                # Windows setup script
```

## ⚙️ Configuration

### Backend Configuration (chat-server/server.js)

Key configuration options:

```javascript
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Rate limiting
const MESSAGE_RATE_LIMIT = {
  windowMs: 1000, // 1 second
  max: 5, // 5 messages per second
};

// Validation
const USERNAME_MIN_LENGTH = 2;
const USERNAME_MAX_LENGTH = 20;
const MESSAGE_MAX_LENGTH = 500;
```

### Frontend Configuration (chat-client/ChatRoom.jsx)

Socket connection settings:

```javascript
const SOCKET_URL = 'http://localhost:3001';

const socketOptions = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
};
```

## 🔒 Security Features

### Input Validation

- Username: 2-20 characters, sanitized for XSS
- Messages: Max 500 characters, HTML tags stripped
- All user input sanitized before processing

### Rate Limiting

- **Connection rate limit**: 100 connections per 15 minutes per IP
- **Message rate limit**: 5 messages per second per user
- Automatic blocking of rate limit violators

### Security Headers (Helmet.js)

- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- And more...

### CORS Protection

- Configurable allowed origins
- Credentials support for authenticated requests
- Preflight request handling

## 📡 API Documentation

### Socket.io Events

#### Client → Server

**`join`** - User joins the chat room

```javascript
socket.emit('join', { username: 'John' });
```

**`send_message`** - Send a chat message

```javascript
socket.emit('send_message', { text: 'Hello world!' });
```

**`typing`** - Notify typing status

```javascript
socket.emit('typing', { isTyping: true });
```

#### Server → Client

**`join_success`** - Successful join confirmation

```javascript
socket.on('join_success', ({ username, users }) => {
  // username: confirmed username
  // users: array of active users
});
```

**`message_history`** - Past messages for new users

```javascript
socket.on('message_history', messages => {
  // Array of previous messages
});
```

**`new_message`** - New message received

```javascript
socket.on('new_message', message => {
  // message: { id, type, username, text, timestamp }
});
```

**`user_joined`** - Another user joined

```javascript
socket.on('user_joined', ({ message, users }) => {
  // System notification and updated user list
});
```

**`user_left`** - User disconnected

```javascript
socket.on('user_left', ({ message, users }) => {
  // System notification and updated user list
});
```

**`user_typing`** - Typing indicator

```javascript
socket.on('user_typing', ({ username, isTyping }) => {
  // Show/hide typing indicator
});
```

**`error`** - Error notification

```javascript
socket.on('error', ({ message }) => {
  // Display error to user
});
```

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**

```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Cannot Connect to Server

**Error:** "Unable to connect to chat server"

**Checklist:**

1. Is the backend server running? Check Terminal 1
2. Is it on the correct port (3001)?
3. Check firewall settings
4. Try `http://127.0.0.1:3000` instead of `localhost`

### Dependencies Not Installing

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Extending the Application

### Adding Persistent Storage

```javascript
// Install database driver
npm install mongoose  // for MongoDB
// or
npm install pg       // for PostgreSQL
```

### Adding User Authentication

```javascript
// Install JWT
npm install jsonwebtoken bcrypt
```

### Adding Private Messages

```javascript
// Extend Socket.io rooms for 1-on-1 messaging
socket.on('private_message', ({ to, text }) => {
  io.to(userSockets[to]).emit('private_message', {
    from: username,
    text: text,
  });
});
```

### Adding File Uploads

```javascript
npm install multer
```

## 📄 License

This project is licensed under the MIT License.

---

**Made with ❤️ for real-time communication**

For questions or support, please open an issue.
