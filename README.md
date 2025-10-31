# Crypto MLM Platform

A full-stack crypto investment platform with multi-level marketing features, USDT deposits/withdrawals, and automated profit distribution.

## Features

- User registration (email verification disabled for easy testing)
- USDT deposits and withdrawals (crypto only)
- Multi-level network tree (up to 10 levels)
- Automated profit/loss calculation and distribution
- Network bonus system
- Admin panel for approvals and trading results
- Professional, minimal UI

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Crypto integration (ethers.js)

### Frontend
- React 18 + TypeScript
- TailwindCSS + shadcn/ui
- Redux Toolkit
- React Router
- Axios

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your database and JWT secret in .env
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
├── backend/          # Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   └── package.json
│
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
│
└── README.md
```

## Environment Variables

See `.env.example` files in backend and frontend directories.

## Deployment

### Railway (Recommended)

This project is configured for easy deployment to Railway:

1. **Quick Start**: Run `./deploy-to-railway.sh`
2. **Full Guide**: See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

Railway will host:
- ✅ PostgreSQL Database
- ✅ Backend API (Node.js)
- ✅ Frontend App (React)

All in a single project with automatic deployments from GitHub.

### Local Development

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed local setup instructions.

## Documentation

- 📖 [Setup Guide](SETUP_GUIDE.md) - Local development setup
- 🚂 [Railway Deployment](RAILWAY_DEPLOYMENT.md) - Deploy to Railway
- 🎯 [API Documentation](SETUP_GUIDE.md#api-endpoints) - API endpoints reference

## License

MIT
