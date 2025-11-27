# 🚂 Railway Project Information

## Active Railway Deployment

- **Railway Project**: LiaiZen Demo
- **Railway Service**: positive-recreation
- **Domain**: `demo-production-6dcd.up.railway.app`
- **Status**: ✅ Active - Production backend

## Configuration

### Railway Dashboard Path
1. Go to: https://railway.app/dashboard
2. Open: **LiaiZen Demo** project
3. Open: **positive-recreation** service

### Key Settings
- **Root Directory**: `chat-server`
- **Branch**: `main` (or your production branch)
- **Environment**: Production

### Environment Variables
Located in: Railway Dashboard → LiaiZen Demo → positive-recreation → Variables

Required variables:
- `DATABASE_URL` (PostgreSQL - auto-set by Railway)
- `FRONTEND_URL` (should include Vercel domains)
- `JWT_SECRET`
- `NODE_ENV=production`
- `OPENAI_API_KEY`
- Other required variables from `.env.example`

## Vercel Configuration

Vercel should point to this Railway deployment:
- **Environment Variable**: `VITE_API_URL`
- **Value**: `https://demo-production-6dcd.up.railway.app`
- **Location**: Vercel Dashboard → Settings → Environment Variables

## Quick Reference

- **Railway Project**: LiaiZen Demo
- **Service Name**: positive-recreation
- **Backend URL**: `https://demo-production-6dcd.up.railway.app`
- **Frontend URL**: `https://www.coparentliaizen.com`





