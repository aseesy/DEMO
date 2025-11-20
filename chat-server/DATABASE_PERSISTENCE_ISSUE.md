# Database Persistence Issue

## Problem
Messages are not persisting because the database file (`chat.db`) is stored in an ephemeral filesystem on Railway/Vercel. Every time the server restarts or redeploys, the database file is wiped.

## Current Setup
- Using SQL.js (in-memory SQLite database)
- Database file saved to: `process.env.DB_PATH || ./chat.db`
- Database IS being saved correctly, but file is lost on restart

## Solutions

### Option 1: Railway Volumes (Quick Fix)
Configure Railway to use a persistent volume:

1. In Railway dashboard, go to your service
2. Add a volume mount (e.g., `/data`)
3. Set environment variable: `DB_PATH=/data/chat.db`
4. Redeploy

**Pros:** Quick fix, minimal code changes
**Cons:** Still using SQLite, not scalable, single-server only

### Option 2: Migrate to PostgreSQL (Recommended)
Use Railway Postgres or another managed database:

1. Add Railway Postgres plugin to your project
2. Get connection string from Railway
3. Replace SQL.js with `pg` (PostgreSQL client)
4. Update all database queries to use PostgreSQL syntax

**Pros:** Persistent, scalable, production-ready, supports multiple servers
**Cons:** Requires code migration

### Option 3: Use Cloud Database Service
- Supabase (PostgreSQL)
- PlanetScale (MySQL)
- MongoDB Atlas
- Railway Postgres

## Current Database Schema
The `messages` table includes:
- `id`, `type`, `username`, `text`, `timestamp`
- `room_id` (for room-based persistence)
- `thread_id` (for threading)
- AI intervention fields (`validation`, `tip1`, `tip2`, `rewrite`)
- Editing/deletion tracking (`edited`, `deleted`)
- Reactions and flagging

## Verification
To check if database is persisting:
1. Check server logs for: `✅ Database saved to: /path/to/chat.db`
2. Check if `DB_PATH` environment variable is set
3. Verify Railway volume is mounted (if using volumes)
4. Check if database file exists after restart

## Immediate Action
Check Railway/Vercel environment variables:
- Is `DB_PATH` set?
- Is it pointing to a persistent volume?
- Check server logs for database save errors

