# Quick Start Guide

## ✅ What's Fixed

1. **Email Verification Disabled** - Users are auto-verified on registration
2. **Registration Working** - Signup now completes successfully
3. **Railway Deployment Ready** - All configuration files created

## 🚀 Local Testing (Currently Running)

Your app is running at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001
- **Database**: PostgreSQL on port 5432

### Test the App Now:
1. Go to http://localhost:5173
2. Click "Sign up"
3. Fill in the registration form
4. Click "Create Account" 
5. Login with your credentials
6. You're in! 🎉

### Create Admin User:
```bash
psql crypto_mlm -c "UPDATE \"User\" SET \"isAdmin\" = true WHERE email = 'your-email@example.com';"
```

## 🚂 Deploy to Railway

### Step 1: Push to GitHub

```bash
cd /Users/abhyuday/Desktop/mlm

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/your-repo.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 3: Add Services

#### PostgreSQL Database:
- Click "+ New" → "Database" → "PostgreSQL"
- No configuration needed

#### Backend Service:
- Click "+ New" → "GitHub Repo"
- **Root Directory**: `backend`
- **Environment Variables**:
  ```
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  PORT=5001
  NODE_ENV=production
  JWT_SECRET=your-secure-random-secret-here
  FRONTEND_URL=https://your-frontend.railway.app
  ```
- Generate domain for backend

#### Frontend Service:
- Click "+ New" → "GitHub Repo" (same repo)
- **Root Directory**: `frontend`
- **Environment Variables**:
  ```
  VITE_API_URL=https://your-backend.railway.app/api
  ```
- Generate domain for frontend

### Step 4: Update URLs

1. Copy backend Railway URL
2. Update frontend `VITE_API_URL` with backend URL
3. Copy frontend Railway URL
4. Update backend `FRONTEND_URL` with frontend URL
5. Both services will auto-redeploy

## 📁 Files Created for Railway

- ✅ `railway.json` - Railway project config
- ✅ `backend/nixpacks.toml` - Backend build config
- ✅ `frontend/nixpacks.toml` - Frontend build config
- ✅ `RAILWAY_DEPLOYMENT.md` - Detailed deployment guide
- ✅ `deploy-to-railway.sh` - Deployment helper script

## 🎯 Key Features

### User Features:
- Registration & Login (no email verification needed)
- Dashboard with balance and network stats
- Deposit & Withdraw USDT
- Referral system with unique codes
- Network tree (10 levels)
- Transaction history

### Admin Features:
- Approve/Reject deposits
- Approve/Reject withdrawals
- Input trading results
- Distribute profits to users
- View system statistics

## 🔧 Configuration Changes Made

1. **Disabled Email Verification**:
   - Users auto-verified on signup
   - No email credentials needed
   - Can login immediately after registration

2. **Updated CORS**:
   - Accepts multiple origins
   - Works with Railway URLs

3. **Database**: 
   - Using PostgreSQL with Prisma
   - All migrations ready

## 📚 Documentation

- **Full Setup**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Railway Deploy**: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
- **API Reference**: See SETUP_GUIDE.md for all endpoints

## ⚠️ Important Notes

1. **JWT Secret**: Use a strong random string in production
2. **Database**: Railway PostgreSQL auto-configures DATABASE_URL
3. **Domains**: Update environment variables after generating Railway domains
4. **Admin**: Create admin user via database after first signup

## 🎉 Ready to Go!

Your crypto MLM platform is ready for:
- ✅ Local development and testing
- ✅ Railway deployment
- ✅ Production use

**Next**: Try signing up at http://localhost:5173 or deploy to Railway!
