#!/bin/bash

echo "🚂 Railway Deployment Setup Script"
echo "===================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Crypto MLM Platform"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create a GitHub repository at: https://github.com/new"
echo "2. Run these commands to push your code:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/crypto-mlm.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Go to Railway: https://railway.app"
echo "4. Click 'New Project' → 'Deploy from GitHub'"
echo "5. Select your repository"
echo ""
echo "6. Add PostgreSQL database:"
echo "   - Click '+ New' → 'Database' → 'PostgreSQL'"
echo ""
echo "7. Deploy Backend:"
echo "   - Click '+ New' → 'GitHub Repo' → Select repo"
echo "   - Set Root Directory: 'backend'"
echo "   - Add environment variables (see RAILWAY_DEPLOYMENT.md)"
echo ""
echo "8. Deploy Frontend:"
echo "   - Click '+ New' → 'GitHub Repo' → Select repo" 
echo "   - Set Root Directory: 'frontend'"
echo "   - Add environment variable: VITE_API_URL"
echo ""
echo "📖 Full guide available in: RAILWAY_DEPLOYMENT.md"
echo ""
