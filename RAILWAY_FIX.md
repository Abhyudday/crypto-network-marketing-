# ✅ Railway Deployment Fix

## The Problem

You got this error:
```
Nixpacks was unable to generate a build plan for this app.
```

## Why It Happened

Railway tried to build from the **root directory**, but your project is a **monorepo** with:
```
/Users/abhyuday/Desktop/mlm/
├── backend/     ← Node.js app
├── frontend/    ← React app
└── other files
```

Railway doesn't know which one to build!

## The Solution

Deploy `backend` and `frontend` as **separate services** in the same Railway project.

## Visual Guide

```
┌─────────────────────────────────────────────────────────┐
│         Railway Project: "Crypto MLM Platform"          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │   Backend    │  │   Frontend   │  │
│  │   Database   │  │   Service    │  │   Service    │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  │
│  │              │  │ GitHub Repo  │  │ GitHub Repo  │  │
│  │ Auto-created │  │ Root: backend│  │ Root:frontend│  │
│  │              │  │              │  │              │  │
│  │ DATABASE_URL │◄─┤ Uses DB      │  │ Calls API    │──┐│
│  │              │  │              │  │              │  ││
│  └──────────────┘  └──────┬───────┘  └──────────────┘  ││
│                           │                             ││
│                           │  FRONTEND_URL               ││
│                           └─────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Fix

### 1. Create Empty Project First
❌ Don't: "Deploy from GitHub repo" (tries to build root)
✅ Do: "Empty Project" then add services

### 2. Add PostgreSQL
- Click "+ New" → "Database" → "PostgreSQL"
- Done automatically

### 3. Add Backend Service
- Click "+ New" → "GitHub Repo"
- Select your repository
- **Go to Settings** → Set **Root Directory** = `backend`
- This tells Railway to build only the backend folder

### 4. Add Frontend Service
- Click "+ New" → "GitHub Repo" (same repo again)
- Select your repository
- **Go to Settings** → Set **Root Directory** = `frontend`
- This tells Railway to build only the frontend folder

## Configuration Files Created

✅ `backend/nixpacks.toml` - Tells Railway how to build backend
✅ `frontend/nixpacks.toml` - Tells Railway how to build frontend
✅ `railway.toml` - Root config (not used, just for reference)

## Environment Variables

### Backend Needs:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=5001
NODE_ENV=production
JWT_SECRET=your-secret-here
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend Needs:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

## How to Set Root Directory in Railway

1. Click on your service (backend or frontend)
2. Go to **"Settings"** tab
3. Scroll down to **"Service"** section
4. Find **"Root Directory"** field
5. Enter `backend` or `frontend`
6. Railway will redeploy automatically

## Verification

After deployment, you should see:

```
📦 Crypto MLM Platform
├── 🗄️  Postgres (Active)
├── 🔧 backend (Active) - https://backend-xxx.railway.app
└── 🌐 frontend (Active) - https://frontend-xxx.railway.app
```

Test:
- Backend health: `https://backend-xxx.railway.app/health`
- Frontend: `https://frontend-xxx.railway.app`

## Complete Guide

For detailed instructions, see:
- **Simple**: [RAILWAY_STEPS.md](RAILWAY_STEPS.md)
- **Detailed**: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

## Summary

✅ **Fixed**: Railway now knows to build backend and frontend separately
✅ **How**: Set Root Directory for each service
✅ **Result**: Both services deploy successfully in one project
