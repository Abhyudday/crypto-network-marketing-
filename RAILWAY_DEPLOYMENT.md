# Railway Deployment Guide

This guide will help you deploy the Crypto MLM Platform to Railway with Frontend, Backend, and Database in a single project.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Account**: Push your code to GitHub
3. **Railway CLI** (optional): `npm i -g @railway/cli`

## Step-by-Step Deployment

### 1. Push Code to GitHub

```bash
cd /Users/abhyuday/Desktop/mlm
git init
git add .
git commit -m "Initial commit - Crypto MLM Platform"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/crypto-mlm-platform.git
git branch -M main
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Empty Project"** (don't deploy from GitHub yet)
4. Give it a name: "Crypto MLM Platform"

### 3. Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will provision a PostgreSQL database
4. Note: The `DATABASE_URL` will be automatically available

### 4. Deploy Backend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** and choose your repository
3. **IMPORTANT**: Click on the service settings (gear icon)
4. Under **"Service Settings"**, set:
   - **Root Directory**: `backend`
   - **Watch Paths**: `backend/**`
5. Railway will auto-detect the Node.js project from nixpacks.toml

#### Backend Environment Variables:

Click on the backend service, go to **"Variables"** tab, and add:

```env
# Database (automatically provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server
PORT=5001
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secure-random-jwt-secret-key-here

# Frontend URL (will be set after frontend deployment)
FRONTEND_URL=https://your-frontend-url.railway.app

# Email (optional - skip for now)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Crypto (placeholders)
USDT_CONTRACT_ADDRESS=0x...
CRYPTO_RPC_URL=https://...

# Profit split
PROFIT_INVESTOR_PERCENT=60
PROFIT_COMPANY_PERCENT=40
```

**Important**: 
- Replace `JWT_SECRET` with a strong random string
- `DATABASE_URL` will auto-reference the PostgreSQL service
- Update `FRONTEND_URL` after deploying frontend

### 5. Deploy Frontend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** and choose your repository again
3. **IMPORTANT**: Click on the service settings (gear icon)
4. Under **"Service Settings"**, set:
   - **Root Directory**: `frontend`
   - **Watch Paths**: `frontend/**`
5. Railway will auto-detect the Vite project from nixpacks.toml

#### Frontend Environment Variables:

Click on the frontend service, go to **"Variables"** tab, and add:

```env
# API URL (backend service URL)
VITE_API_URL=https://your-backend-url.railway.app/api
```

**Replace** `your-backend-url.railway.app` with your actual backend Railway URL.

### 6. Configure Service Settings

#### Backend Service:
1. Click on the backend service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Copy this URL (e.g., `https://crypto-mlm-backend.up.railway.app`)

#### Frontend Service:
1. Click on the frontend service
2. Go to **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Copy this URL (e.g., `https://crypto-mlm-frontend.up.railway.app`)

### 7. Update Environment Variables

#### Update Backend `FRONTEND_URL`:
1. Go to backend service → **"Variables"**
2. Update `FRONTEND_URL` with your frontend Railway URL
3. Redeploy backend (it will automatically redeploy)

#### Update Frontend `VITE_API_URL`:
1. Go to frontend service → **"Variables"**
2. Update `VITE_API_URL` with your backend Railway URL + `/api`
3. Example: `https://crypto-mlm-backend.up.railway.app/api`
4. Redeploy frontend

### 8. Verify Deployment

1. **Check Backend Health**:
   - Visit: `https://your-backend-url.railway.app/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend**:
   - Visit: `https://your-frontend-url.railway.app`
   - You should see the login page

3. **Test Registration**:
   - Create a new account
   - Login with credentials
   - Check if dashboard loads

### 9. Create Admin User

Since email verification is disabled, you can create an admin user directly in the database:

1. Go to Railway project → PostgreSQL service
2. Click **"Data"** tab or use **Railway CLI**:
   
```bash
# Using Railway CLI
railway run psql $DATABASE_URL

# Or in Railway web console
# Find your user email and run:
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

## Railway Project Structure

Your Railway project should have **3 services**:

```
📦 Crypto MLM Platform (Railway Project)
├── 🗄️  PostgreSQL Database
├── 🔧 Backend Service (from /backend)
└── 🌐 Frontend Service (from /frontend)
```

## Environment Variables Summary

### Backend Variables:
- ✅ `DATABASE_URL` - Auto-provided by Railway
- ✅ `PORT` - 5001
- ✅ `NODE_ENV` - production
- ✅ `JWT_SECRET` - Your secure secret
- ✅ `FRONTEND_URL` - Frontend Railway URL
- ⚠️ `EMAIL_*` - Optional (for email features)

### Frontend Variables:
- ✅ `VITE_API_URL` - Backend Railway URL + /api

## Troubleshooting

### Backend Not Starting:
1. Check logs in Railway dashboard
2. Verify `DATABASE_URL` is set
3. Ensure Prisma migrations ran (automatic in nixpacks.toml)

### Frontend Shows 404:
1. Check if `VITE_API_URL` is correct
2. Verify backend is running
3. Check CORS settings in backend

### Database Connection Issues:
1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` format
3. Restart backend service

### CORS Errors:
1. Ensure `FRONTEND_URL` in backend matches your frontend Railway URL
2. Check browser console for exact error
3. Update CORS settings in `backend/src/server.ts` if needed

## Custom Domains (Optional)

1. Go to Railway service → **"Settings"** → **"Domains"**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `crypto-mlm.com`)
4. Update DNS records as shown by Railway
5. Update environment variables with new domain

## Updating the Application

Railway auto-deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Railway will automatically detect changes and redeploy
```

## Monitoring

- **View Logs**: Click on service → "Logs" tab
- **Metrics**: Click on service → "Metrics" tab
- **Database**: PostgreSQL service → "Data" tab for direct access

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month for 500 hours + $0.000231/GB RAM/hr
- **PostgreSQL**: Included in usage-based pricing
- **Estimated**: ~$5-10/month for small-medium traffic

## Security Checklist

- ✅ Use strong `JWT_SECRET`
- ✅ Enable HTTPS (automatic on Railway)
- ✅ Secure database credentials
- ✅ Environment variables set correctly
- ⚠️ Configure rate limiting (optional)
- ⚠️ Set up monitoring/alerts

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

For application issues:
- Check application logs in Railway
- Review `SETUP_GUIDE.md` for configuration details
