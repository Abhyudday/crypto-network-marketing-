import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Public endpoint to get deposit wallet
export const getDepositWallet = async (req: Request, res: Response) => {
  try {
    // First check database configuration
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'ADMIN_DEPOSIT_WALLET' },
    });

    let walletAddress = config?.value;

    // If not in database, check environment variables
    if (!walletAddress && process.env.ADMIN_DEPOSIT_WALLET) {
      walletAddress = process.env.ADMIN_DEPOSIT_WALLET;
      
      // Optionally save to database for future use
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
    }

    if (!walletAddress) {
      return res.status(404).json({ 
        error: 'Deposit wallet not configured. Please contact admin.' 
      });
    }

    // Get network from environment or default to Sepolia testnet
    const network = process.env.DEPOSIT_NETWORK || 'Sepolia Testnet';
    const tokenName = process.env.DEPOSIT_TOKEN || 'ETH';
    const isTestnet = network.toLowerCase().includes('test') || network.toLowerCase().includes('sepolia') || network.toLowerCase().includes('goerli');

    res.json({
      walletAddress,
      network,
      tokenName,
      isTestnet,
      instructions: [
        `Send ${tokenName} on ${network} to the wallet address shown above`,
        'Enter the amount you sent in the deposit form',
        'Provide your wallet address and transaction hash',
        isTestnet ? 'Test network: Use testnet tokens for testing' : 'Wait for admin approval (usually within 24 hours)',
        'Your balance will be updated after approval'
      ]
    });
  } catch (error) {
    console.error('Get deposit wallet error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit wallet' });
  }
};

// Admin endpoint to update deposit wallet
export const updateDepositWallet = async (req: AuthRequest, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const config = await prisma.systemConfig.upsert({
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

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.userId!,
        actionType: 'UPDATE_DEPOSIT_WALLET',
        details: `Updated deposit wallet address to ${walletAddress}`,
      },
    });

    res.json({
      message: 'Deposit wallet address updated successfully',
      config,
      note: 'Environment variable ADMIN_DEPOSIT_WALLET can also be used as fallback configuration'
    });
  } catch (error) {
    console.error('Update deposit wallet error:', error);
    res.status(500).json({ error: 'Failed to update deposit wallet' });
  }
};

// Admin endpoint to get all system config
export const getAllConfig = async (req: AuthRequest, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    res.json(configs);
  } catch (error) {
    console.error('Get all config error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
};

// Public endpoint to check if withdrawals are enabled
export const getWithdrawalStatus = async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'WITHDRAWAL_ENABLED' },
    });

    const isEnabled = config?.value === 'true';
    const message = config?.description || 'Withdrawal system status';

    res.json({
      enabled: isEnabled,
      message,
    });
  } catch (error) {
    console.error('Get withdrawal status error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal status' });
  }
};

// Admin endpoint to toggle withdrawal system
export const toggleWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { enabled, message } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const config = await prisma.systemConfig.upsert({
      where: { key: 'WITHDRAWAL_ENABLED' },
      update: {
        value: enabled.toString(),
        description: message || (enabled ? 'Withdrawals are currently enabled' : 'Withdrawals are temporarily disabled'),
      },
      create: {
        key: 'WITHDRAWAL_ENABLED',
        value: enabled.toString(),
        description: message || (enabled ? 'Withdrawals are currently enabled' : 'Withdrawals are temporarily disabled'),
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.userId!,
        actionType: 'TOGGLE_WITHDRAWAL',
        details: `${enabled ? 'Enabled' : 'Disabled'} withdrawal system`,
      },
    });

    res.json({
      message: `Withdrawal system ${enabled ? 'enabled' : 'disabled'} successfully`,
      config,
    });
  } catch (error) {
    console.error('Toggle withdrawal error:', error);
    res.status(500).json({ error: 'Failed to toggle withdrawal system' });
  }
};

// Admin endpoint to update system config
export const updateConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value, description } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        description,
      },
      create: {
        key,
        value,
        description,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.userId!,
        actionType: 'UPDATE_CONFIG',
        details: `Updated system config: ${key}`,
      },
    });

    res.json({
      message: 'Configuration updated successfully',
      config,
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
};
