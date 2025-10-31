import { Response } from 'express';
import { PrismaClient, UserLevel } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  sendDepositApprovedEmail,
  sendWithdrawalApprovedEmail,
} from '../utils/email.util';
import { getLevelBonusLevels, getLevelRequirement } from '../utils/helpers';

const prisma = new PrismaClient();

export const getPendingDeposits = async (req: AuthRequest, res: Response) => {
  try {
    const deposits = await prisma.transaction.findMany({
      where: {
        type: 'DEPOSIT',
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(deposits);
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch pending deposits' });
  }
};

export const getPendingWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const withdrawals = await prisma.transaction.findMany({
      where: {
        type: 'WITHDRAWAL',
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(withdrawals);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
  }
};

export const approveDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.userId!;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.type !== 'DEPOSIT') {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Update transaction and user balance
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    const newTotalDeposit = transaction.user.totalDeposit + transaction.amount;

    // Update user level based on deposit
    let newLevel = transaction.user.level;
    if (newTotalDeposit >= 10000) newLevel = UserLevel.VVIP;
    else if (newTotalDeposit >= 5000) newLevel = UserLevel.VIP;
    else if (newTotalDeposit >= 1000) newLevel = UserLevel.INVESTOR;
    else if (newTotalDeposit >= 500) newLevel = UserLevel.BEGINNER;
    else if (newTotalDeposit >= 100) newLevel = UserLevel.STARTER;

    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        balance: transaction.user.balance + transaction.amount,
        totalDeposit: newTotalDeposit,
        level: newLevel,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'APPROVE_DEPOSIT',
        targetId: transactionId,
        details: `Approved deposit of ${transaction.amount} USDT for user ${transaction.user.username}`,
      },
    });

    // Send email notification
    await sendDepositApprovedEmail(transaction.user.email, transaction.amount);

    res.json({
      message: 'Deposit approved successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
};

export const approveWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.userId!;
    const { txHash } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.type !== 'WITHDRAWAL') {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    // Check if user has sufficient balance
    if (transaction.user.balance < transaction.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        txHash: txHash || null,
      },
    });

    // Deduct from user balance
    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        balance: transaction.user.balance - transaction.amount,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'APPROVE_WITHDRAWAL',
        targetId: transactionId,
        details: `Approved withdrawal of ${transaction.amount} USDT for user ${transaction.user.username}`,
      },
    });

    // Send email notification
    await sendWithdrawalApprovedEmail(transaction.user.email, transaction.amount);

    res.json({
      message: 'Withdrawal approved successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
};

export const rejectTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const adminId = req.userId!;
    const { reason } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        remarks: reason,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'REJECT_TRANSACTION',
        targetId: transactionId,
        details: `Rejected ${transaction.type} of ${transaction.amount} USDT for user ${transaction.user.username}. Reason: ${reason}`,
      },
    });

    res.json({
      message: 'Transaction rejected successfully',
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error('Reject transaction error:', error);
    res.status(500).json({ error: 'Failed to reject transaction' });
  }
};

export const inputTradingResult = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { profitPercent, tradingDate, description } = req.body;

    if (profitPercent === undefined || !tradingDate) {
      return res.status(400).json({
        error: 'Profit percent and trading date are required',
      });
    }

    // Check if result already exists for this date
    const existingResult = await prisma.tradingResult.findUnique({
      where: { tradingDate: new Date(tradingDate) },
    });

    if (existingResult) {
      return res.status(400).json({
        error: 'Trading result already exists for this date',
      });
    }

    // Create trading result
    const tradingResult = await prisma.tradingResult.create({
      data: {
        profitPercent: parseFloat(profitPercent),
        tradingDate: new Date(tradingDate),
        description,
        createdBy: adminId,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'INPUT_TRADING_RESULT',
        targetId: tradingResult.id,
        details: `Input trading result: ${profitPercent}% for ${tradingDate}`,
      },
    });

    res.json({
      message: 'Trading result saved successfully',
      tradingResult,
    });
  } catch (error) {
    console.error('Input trading result error:', error);
    res.status(500).json({ error: 'Failed to input trading result' });
  }
};

export const distributeProfit = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { tradingResultId } = req.params;

    const tradingResult = await prisma.tradingResult.findUnique({
      where: { id: tradingResultId },
    });

    if (!tradingResult) {
      return res.status(404).json({ error: 'Trading result not found' });
    }

    if (tradingResult.processedAt) {
      return res.status(400).json({ error: 'Trading result already processed' });
    }

    // Get all users with balance
    const users = await prisma.user.findMany({
      where: {
        balance: { gt: 0 },
      },
    });

    const profitPercent = tradingResult.profitPercent / 100;
    const investorShare = parseFloat(process.env.INVESTOR_PROFIT_SHARE || '0.6');

    // Distribute profit to each user
    for (const user of users) {
      const userProfit = user.balance * profitPercent * investorShare;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: user.balance + userProfit,
        },
      });

      await prisma.profitHistory.create({
        data: {
          userId: user.id,
          profitPercent: tradingResult.profitPercent,
          profitAmount: userProfit,
          tradingDate: tradingResult.tradingDate,
        },
      });

      // Also create a transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: userProfit,
          type: 'PROFIT',
          status: 'COMPLETED',
          remarks: `Profit distribution for ${tradingResult.tradingDate.toDateString()}`,
        },
      });
    }

    // Mark as processed
    await prisma.tradingResult.update({
      where: { id: tradingResultId },
      data: { processedAt: new Date() },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'DISTRIBUTE_PROFIT',
        targetId: tradingResultId,
        details: `Distributed ${tradingResult.profitPercent}% profit to ${users.length} users`,
      },
    });

    res.json({
      message: 'Profit distributed successfully',
      usersAffected: users.length,
    });
  } catch (error) {
    console.error('Distribute profit error:', error);
    res.status(500).json({ error: 'Failed to distribute profit' });
  }
};

export const distributeBonus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate and distribute network bonus based on user level
    const bonusLevels = getLevelBonusLevels(user.level);

    if (bonusLevels === 0) {
      return res.status(400).json({ error: 'User level does not qualify for network bonus' });
    }

    // Get recent profits
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const recentProfit = await prisma.profitHistory.findFirst({
      where: {
        userId: user.id,
        tradingDate: { gte: yesterday },
      },
    });

    if (!recentProfit) {
      return res.status(400).json({ error: 'No recent profit found for bonus calculation' });
    }

    const companyShare = parseFloat(process.env.COMPANY_PROFIT_SHARE || '0.4');
    const bonusPool = recentProfit.profitAmount / (1 - companyShare) * companyShare;

    // Distribute bonus based on level
    // This is a simplified version - implement full MLM logic as needed
    const bonusAmount = bonusPool * 0.1; // Example: 10% of bonus pool

    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: user.balance + bonusAmount,
      },
    });

    await prisma.bonusHistory.create({
      data: {
        userId: user.id,
        bonusAmount,
        bonusType: 'NETWORK_BONUS',
        description: `Network bonus for ${recentProfit.tradingDate.toDateString()}`,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: bonusAmount,
        type: 'BONUS',
        status: 'COMPLETED',
        remarks: 'Network bonus',
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'DISTRIBUTE_BONUS',
        targetId: userId,
        details: `Distributed network bonus of ${bonusAmount} USDT to ${user.username}`,
      },
    });

    res.json({
      message: 'Bonus distributed successfully',
      bonusAmount,
    });
  } catch (error) {
    console.error('Distribute bonus error:', error);
    res.status(500).json({ error: 'Failed to distribute bonus' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        balance: true,
        totalDeposit: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBalance = await prisma.user.aggregate({
      _sum: { balance: true },
    });
    const totalDeposits = await prisma.transaction.aggregate({
      where: { type: 'DEPOSIT', status: 'APPROVED' },
      _sum: { amount: true },
    });
    const totalWithdrawals = await prisma.transaction.aggregate({
      where: { type: 'WITHDRAWAL', status: 'APPROVED' },
      _sum: { amount: true },
    });
    const pendingDeposits = await prisma.transaction.count({
      where: { type: 'DEPOSIT', status: 'PENDING' },
    });
    const pendingWithdrawals = await prisma.transaction.count({
      where: { type: 'WITHDRAWAL', status: 'PENDING' },
    });

    res.json({
      totalUsers,
      totalBalance: totalBalance._sum.balance || 0,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      pendingDeposits,
      pendingWithdrawals,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};
