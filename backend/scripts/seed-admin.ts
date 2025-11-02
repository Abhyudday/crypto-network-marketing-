import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  console.log('🚀 MLM Platform - Admin Setup\n');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      const proceed = await question('Do you want to create another admin? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Setup cancelled.');
        rl.close();
        process.exit(0);
      }
    }

    // Get admin details
    console.log('\n📝 Create Admin Account\n');
    const username = await question('Username: ');
    const email = await question('Email: ');
    const phone = await question('Phone: ');
    const password = await question('Password: ');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    const referralCode = `ADMIN${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        password: hashedPassword,
        referralCode,
        isAdmin: true,
        emailVerified: true,
        level: 'VVIP',
        balance: 0,
        totalDeposit: 0,
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('👤 Username:', admin.username);
    console.log('📧 Email:', admin.email);
    console.log('🔗 Referral Code:', admin.referralCode);

    // Ask for deposit wallet configuration
    console.log('\n💼 Configure Deposit Wallet\n');
    const configureWallet = await question('Do you want to set the admin deposit wallet now? (y/n): ');

    if (configureWallet.toLowerCase() === 'y') {
      const walletAddress = await question('Enter USDT (TRC20) wallet address: ');

      await prisma.systemConfig.upsert({
        where: { key: 'ADMIN_DEPOSIT_WALLET' },
        update: {
          value: walletAddress,
          description: 'Admin wallet address for receiving USDT deposits (TRC20)',
        },
        create: {
          key: 'ADMIN_DEPOSIT_WALLET',
          value: walletAddress,
          description: 'Admin wallet address for receiving USDT deposits (TRC20)',
        },
      });

      console.log('✅ Deposit wallet configured:', walletAddress);
    } else {
      console.log('⚠️  Deposit wallet not configured. You can set it later from the admin dashboard.');
    }

    // Set default system config
    await prisma.systemConfig.upsert({
      where: { key: 'INVESTOR_PROFIT_SHARE' },
      update: { value: '0.6' },
      create: {
        key: 'INVESTOR_PROFIT_SHARE',
        value: '0.6',
        description: 'Investor profit share (60% for investors, 40% for company)',
      },
    });

    await prisma.systemConfig.upsert({
      where: { key: 'COMPANY_PROFIT_SHARE' },
      update: { value: '0.4' },
      create: {
        key: 'COMPANY_PROFIT_SHARE',
        value: '0.4',
        description: 'Company profit share (used for network bonuses)',
      },
    });

    console.log('\n✅ System configuration initialized');
    console.log('\n🎉 Setup complete! You can now login with the admin credentials.');
    console.log('📍 Admin Panel: http://localhost:5173/admin\n');
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
