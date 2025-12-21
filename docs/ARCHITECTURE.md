# System Architecture Documentation

## Overview

This document explains how all the pieces of your multi-user chat room work together.

---

## High-Level Architecture

```
Users (Browsers)
       ↓
Frontend (React on port 3000)
       ↓
WebSocket Connection
       ↓
Backend Server (Node.js on port 3001)
       ↓
In-Memory Storage
```

---

## Key Components

### 1. Frontend (React Client)

- What users see and interact with
- Sends/receives messages via WebSocket
- Validates input locally
- Shows real-time updates

### 2. Backend (Node.js Server)

- Handles all connections
- Validates all data
- Broadcasts messages to users
- Manages user sessions

### 3. WebSockets

- Real-time bidirectional communication
- Instant message delivery
- Persistent connection

---

## Security Layers

1. **Input Validation** - Both frontend and backend
2. **Rate Limiting** - Prevents spam (100 requests/15min)
3. **CORS** - Controls who can connect
4. **Helmet.js** - Security headers
5. **Sanitization** - Removes dangerous characters

---

## How Messages Flow

1. User types message
2. Frontend validates and sends to server
3. Server validates again (never trust client)
4. Server sanitizes content
5. Server broadcasts to all connected users
6. All clients receive and display message

---

## Scaling Path

**Current:** 10-100 users
**Next Step:** Add Redis for 100-1,000 users
**Large Scale:** Multiple servers + load balancer + database

---

For detailed technical information, see README.md
