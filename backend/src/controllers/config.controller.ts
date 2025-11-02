import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Public endpoint to get deposit wallet address
export const getDepositWallet = async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'ADMIN_DEPOSIT_WALLET' },
    });

    if (!config) {
      return res.status(404).json({ 
        error: 'Deposit wallet not configured. Please contact admin.' 
      });
    }

    res.json({
      walletAddress: config.value,
      network: 'TRC20', // USDT on Tron network
      instructions: [
        'Send USDT (TRC20) to the wallet address shown above',
        'Enter the amount you sent in the deposit form',
        'Provide your wallet address and transaction hash',
        'Wait for admin approval (usually within 24 hours)',
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
