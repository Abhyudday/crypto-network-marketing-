# Railway Deployment - Simple Steps

## ⚠️ Important: This is a Monorepo

Your project has both `backend/` and `frontend/` folders. Railway needs to deploy them as **separate services**.

## 📋 Step-by-Step Instructions

### Step 1: Push to GitHub

```bash
cd /Users/abhyuday/Desktop/mlm

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub: https://github.com/new
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/crypto-mlm.git
git branch -M main
git push -u origin main
```

### Step 2: Create Empty Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Empty Project"**
4. Name it: "Crypto MLM Platform"

### Step 3: Add PostgreSQL Database

1. Click **"+ New"** in your project
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Done! Database is ready

### Step 4: Deploy Backend

1. Click **"+ New"** in your project
2. Select **"GitHub Repo"**
3. Choose your `crypto-mlm` repository
4. Railway will create a service

**Configure Backend Service:**

5. Click on the new service card
6. Go to **"Settings"** tab
7. Scroll to **"Service"** section
8. Set **Root Directory**: `backend`
9. Set **Build Command**: (leave empty, uses nixpacks.toml)
10. Set **Start Command**: (leave empty, uses nixpacks.toml)

**Add Environment Variables:**

11. Go to **"Variables"** tab
12. Click **"+ New Variable"** and add these:

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
PORT = 5001
NODE_ENV = production
JWT_SECRET = your-super-secret-random-string-here-change-this
FRONTEND_URL = https://your-frontend-url.railway.app
```

**Generate Domain:**

13. Go to **"Settings"** → **"Networking"**
14. Click **"Generate Domain"**
15. Copy the URL (e.g., `https://crypto-mlm-backend-production.up.railway.app`)

### Step 5: Deploy Frontend

1. Click **"+ New"** in your project
2. Select **"GitHub Repo"**
3. Choose your `crypto-mlm` repository again
4. Railway will create another service

**Configure Frontend Service:**

5. Click on the new service card
6. Go to **"Settings"** tab
7. Scroll to **"Service"** section
8. Set **Root Directory**: `frontend`
9. Set **Build Command**: (leave empty, uses nixpacks.toml)
10. Set **Start Command**: (leave empty, uses nixpacks.toml)

**Add Environment Variables:**

11. Go to **"Variables"** tab
12. Click **"+ New Variable"** and add:

```
VITE_API_URL = https://your-backend-url.railway.app/api
```

Replace `your-backend-url.railway.app` with the backend URL from Step 4.

**Generate Domain:**

13. Go to **"Settings"** → **"Networking"**
14. Click **"Generate Domain"**
15. Copy the URL (e.g., `https://crypto-mlm-frontend-production.up.railway.app`)

### Step 6: Update Backend FRONTEND_URL

1. Go back to **Backend service**
2. Go to **"Variables"** tab
3. Update `FRONTEND_URL` with the frontend URL from Step 5
4. Backend will automatically redeploy

### Step 7: Verify Deployment

**Check Backend:**
- Visit: `https://your-backend-url.railway.app/health`
- Should show: `{"status":"ok","timestamp":"..."}`

**Check Frontend:**
- Visit: `https://your-frontend-url.railway.app`
- Should show the login page

**Test Registration:**
- Click "Sign up"
- Create an account
- Login
- Success! 🎉

## 🎯 Final Project Structure

Your Railway project should have **3 services**:

```
📦 Crypto MLM Platform
├── 🗄️  Postgres (Database)
├── 🔧 crypto-mlm-backend (Backend API)
└── 🌐 crypto-mlm-frontend (Frontend App)
```

## 🔑 Environment Variables Reference

### Backend Variables:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
PORT=5001
NODE_ENV=production
JWT_SECRET=your-secure-secret-here
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend Variables:
```env
VITE_API_URL=https://your-backend.railway.app/api
```

## 🐛 Troubleshooting

### "Nixpacks was unable to generate a build plan"
- ✅ **Solution**: Make sure you set **Root Directory** to `backend` or `frontend`
- Railway needs to know which folder to build from

### Backend won't start
- Check **Variables** tab - ensure `DATABASE_URL` is set
- Check **Logs** tab for errors
- Verify `JWT_SECRET` is set

### Frontend shows blank page
- Check **Variables** tab - ensure `VITE_API_URL` is correct
- Open browser console for errors
- Verify backend URL is accessible

### CORS errors
- Update backend `FRONTEND_URL` variable
- Make sure it matches your frontend Railway URL exactly
- Redeploy backend after changing

## 📝 Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Backend service deployed with Root Directory = `backend`
- [ ] Backend environment variables set
- [ ] Backend domain generated
- [ ] Frontend service deployed with Root Directory = `frontend`
- [ ] Frontend environment variables set (with backend URL)
- [ ] Frontend domain generated
- [ ] Backend FRONTEND_URL updated (with frontend URL)
- [ ] Both services showing "Active" status
- [ ] Health check working
- [ ] Can access frontend and signup

## 🎉 You're Done!

Your Crypto MLM Platform is now live on Railway!

**URLs:**
- Frontend: `https://your-frontend.railway.app`
- Backend: `https://your-backend.railway.app`
- Database: Managed by Railway

**Next Steps:**
- Create an admin user (see SETUP_GUIDE.md)
- Test all features
- Share your platform!
