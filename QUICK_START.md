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

⚠️ **Important**: This is a monorepo. You need to deploy `backend` and `frontend` as **separate services**.

### Quick Deploy Steps:

1. **Push to GitHub**
   ```bash
   cd /Users/abhyuday/Desktop/mlm
   git init && git add . && git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/crypto-mlm.git
   git push -u origin main
   ```

2. **Create Railway Project**
   - Go to https://railway.app
   - Click "New Project" → "Empty Project"

3. **Add PostgreSQL**
   - Click "+ New" → "Database" → "PostgreSQL"

4. **Deploy Backend**
   - Click "+ New" → "GitHub Repo" → Select your repo
   - **Settings** → Set **Root Directory** to `backend`
   - **Variables** → Add environment variables (see RAILWAY_STEPS.md)
   - **Networking** → Generate domain

5. **Deploy Frontend**
   - Click "+ New" → "GitHub Repo" → Select your repo again
   - **Settings** → Set **Root Directory** to `frontend`
   - **Variables** → Add `VITE_API_URL` with backend URL
   - **Networking** → Generate domain

6. **Update URLs**
   - Update backend `FRONTEND_URL` with frontend URL
   - Done! 🎉

📖 **Detailed Guide**: See [RAILWAY_STEPS.md](RAILWAY_STEPS.md) for complete step-by-step instructions

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
