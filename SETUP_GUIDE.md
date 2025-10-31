# Crypto MLM Platform - Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**
- **Git**

## Step 1: Database Setup

1. Install and start PostgreSQL
2. Create a new database:
```bash
createdb crypto_mlm
```

3. Note your database credentials for the `.env` file

## Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your actual values
# Important variables to configure:
# - DATABASE_URL
# - JWT_SECRET
# - EMAIL credentials for sending verification emails
```

### Configure your .env file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/crypto_mlm"
JWT_SECRET="your-random-secure-secret-key-here"
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Run database migrations:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env if backend is running on different port
```

### Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Step 4: Create Admin User

You'll need to manually create an admin user in the database:

```sql
-- Connect to your database
psql crypto_mlm

-- After registering a regular user, promote them to admin
UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@example.com';
```

## Step 5: Email Configuration

For production, configure a proper SMTP service:

### Using Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the app password in your `.env` file

### Using SendGrid, Mailgun, etc:
Update the email configuration in `backend/src/utils/email.util.ts`

## Project Structure

```
mlm/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic
│   │   ├── middleware/        # Auth, error handling
│   │   ├── routes/            # API endpoints
│   │   ├── utils/             # Helper functions
│   │   └── server.ts          # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # React pages
│   │   ├── store/             # Redux store
│   │   ├── utils/             # API client
│   │   └── main.tsx           # Entry point
│   └── package.json
│
└── README.md
```

## Features Implemented

### User Features:
- ✅ Registration with email verification
- ✅ Login with JWT authentication
- ✅ Dashboard with balance and stats
- ✅ Deposit USDT (pending admin approval)
- ✅ Withdraw USDT (pending admin approval)
- ✅ Referral system with unique codes
- ✅ Network tree visualization (10 levels)
- ✅ Transaction history
- ✅ Profit and bonus history
- ✅ Multi-tier membership levels

### Admin Features:
- ✅ Admin dashboard with system stats
- ✅ Approve/reject deposits
- ✅ Approve/reject withdrawals
- ✅ Input daily trading results
- ✅ Distribute profits to all users
- ✅ View all users
- ✅ Monitor pending transactions

### Membership Levels:
- **Starter**: $100 deposit (No level bonus)
- **Beginner**: $500 deposit (3 level bonus)
- **Investor**: $1,000 deposit (7 level bonus)
- **VIP**: $5,000 deposit (10 level bonus)
- **VVIP**: $10,000 deposit (10 level bonus + 5% whole tree)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email

### User
- `GET /api/user/dashboard` - Get dashboard data
- `GET /api/user/profile` - Get user profile
- `GET /api/user/network-tree` - Get network tree
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/profit-history` - Get profit history
- `GET /api/user/bonus-history` - Get bonus history

### Transactions
- `POST /api/transactions/deposit` - Create deposit request
- `POST /api/transactions/withdrawal` - Create withdrawal request
- `GET /api/transactions/my-transactions` - Get user transactions

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/deposits/pending` - Get pending deposits
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals
- `POST /api/admin/deposits/:id/approve` - Approve deposit
- `POST /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/transactions/:id/reject` - Reject transaction
- `POST /api/admin/trading-result` - Input trading result
- `POST /api/admin/trading-result/:id/distribute` - Distribute profit

## Testing the Application

### 1. Register a User
- Go to `http://localhost:5173/register`
- Fill in the registration form
- Check your email for verification link
- Click verification link

### 2. Login
- Go to `http://localhost:5173/login`
- Enter credentials

### 3. Test Deposit
- Click "Deposit" button
- Enter amount and wallet address
- Submit (will be pending)

### 4. Admin Approval
- Login as admin
- Go to Admin Dashboard
- Approve the pending deposit

### 5. Test Trading Result
- As admin, input a trading result (e.g., 2.5%)
- Distribute profits to all users
- Check user balance updates

## Crypto Integration Notes

The current implementation has placeholder crypto integration. To integrate with real USDT transactions:

1. **Install Web3 libraries:**
```bash
npm install ethers web3
```

2. **Update crypto logic** in:
- `backend/src/controllers/transaction.controller.ts`
- Add wallet validation
- Verify transaction hashes
- Implement automatic USDT transfers

3. **Frontend wallet integration:**
- Add MetaMask or WalletConnect
- Sign transactions client-side
- Verify on backend

## Production Deployment

### Backend:
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database
4. Set up proper CORS origins
5. Use environment-specific configs
6. Enable HTTPS

### Frontend:
1. Build for production: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Update `VITE_API_URL` to production backend

### Database:
1. Use managed PostgreSQL (AWS RDS, Heroku, etc.)
2. Enable SSL connections
3. Regular backups
4. Connection pooling

## Security Considerations

- ✅ Passwords hashed with bcrypt
- ✅ JWT for stateless authentication
- ✅ Email verification required
- ✅ Input validation
- ⚠️ Rate limiting (implement for production)
- ⚠️ CSRF protection (implement for production)
- ⚠️ 2FA (optional enhancement)

## Troubleshooting

### Database connection issues:
- Check PostgreSQL is running
- Verify DATABASE_URL format
- Ensure database exists

### Email not sending:
- Check SMTP credentials
- For Gmail, use App Password
- Check firewall/port blocking

### Frontend can't connect to backend:
- Verify backend is running on port 5000
- Check CORS configuration
- Update VITE_API_URL if needed

## Support

For issues or questions:
1. Check error logs in terminal
2. Verify all environment variables
3. Ensure all dependencies are installed
4. Check database migrations ran successfully

## License

MIT
