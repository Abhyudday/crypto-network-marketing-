import { Response } from 'express';
import { PrismaClient, UserLevel } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  sendDepositApprovedEmail,
  sendWithdrawalApprovedEmail,
} from '../utils/email.util';
import { getLevelBonusLevels, getLevelRequirement } from '../utils/helpers';
import { updateUserRank, calculateRankFromBalance } from '../utils/rank.util';

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
            balance: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Include wallet details in response
    const depositsWithDetails = deposits.map(deposit => ({
      ...deposit,
      walletDetails: {
        walletAddress: deposit.walletAddress,
        txHash: deposit.txHash,
      },
    }));

    res.json(depositsWithDetails);
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
            balance: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Include wallet details in response
    const withdrawalsWithDetails = withdrawals.map(withdrawal => ({
      ...withdrawal,
      walletDetails: {
        walletAddress: withdrawal.walletAddress,
      },
    }));

    res.json(withdrawalsWithDetails);
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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            level: true,
            balance: true,
            totalDeposit: true,
          },
        },
      },
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
    const newBalance = transaction.user.balance + transaction.amount;

    // Check if testnet mode (use lower thresholds for testing)
    const network = process.env.DEPOSIT_NETWORK || 'Sepolia Testnet';
    const isTestnet = network.toLowerCase().includes('test') || 
                      network.toLowerCase().includes('sepolia') || 
                      network.toLowerCase().includes('goerli');

    // Calculate rank based on new balance (not total deposit)
    const newLevel = calculateRankFromBalance(newBalance, isTestnet);

    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        balance: newBalance,
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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            level: true,
            balance: true,
            totalDeposit: true,
          },
        },
      },
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
    const newBalance = transaction.user.balance - transaction.amount;
    
    // Check if testnet mode
    const network = process.env.DEPOSIT_NETWORK || 'Sepolia Testnet';
    const isTestnet = network.toLowerCase().includes('test') || 
                      network.toLowerCase().includes('sepolia') || 
                      network.toLowerCase().includes('goerli');
    
    // Calculate new rank based on updated balance (can be downgraded)
    const newLevel = calculateRankFromBalance(newBalance, isTestnet);
    
    await prisma.user.update({
      where: { id: transaction.userId },
      data: {
        balance: newBalance,
        level: newLevel,
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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            level: true,
            balance: true,
            totalDeposit: true,
          },
        },
      },
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
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        balance: true,
        totalDeposit: true,
      },
    });

    const profitPercent = tradingResult.profitPercent / 100;

    let totalBonusDistributed = 0;
    let totalProfitDistributed = 0;

    // Check if testnet mode for rank calculation
    const network = process.env.DEPOSIT_NETWORK || 'Sepolia Testnet';
    const isTestnet = network.toLowerCase().includes('test') || 
                      network.toLowerCase().includes('sepolia') || 
                      network.toLowerCase().includes('goerli');

    // Distribute profit to each user based on their rank
    for (const user of users) {
      // Get profit share ratio based on user's rank
      const { user: userSharePercent } = await import('../utils/rank.util').then(m => m.getProfitShareRatio(user.level));
      const userShare = userSharePercent / 100; // Convert to decimal
      
      const userProfit = user.balance * profitPercent * userShare;
      totalProfitDistributed += userProfit;

      // Calculate new balance and rank
      const newBalance = user.balance + userProfit;
      const newLevel = calculateRankFromBalance(newBalance, isTestnet);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: newBalance,
          level: newLevel,
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

      // Auto-distribute network leveling bonus
      const bonusDistributed = await distributeNetworkBonus(user.id, userProfit, tradingResult.tradingDate);
      totalBonusDistributed += bonusDistributed;
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
        details: `Distributed ${tradingResult.profitPercent}% profit to ${users.length} users. Total bonus distributed: ${totalBonusDistributed.toFixed(2)} USDT`,
      },
    });

    res.json({
      message: 'Profit distributed successfully',
      usersAffected: users.length,
      totalBonusDistributed,
    });
  } catch (error) {
    console.error('Distribute profit error:', error);
    res.status(500).json({ error: 'Failed to distribute profit' });
  }
};

// Helper function to distribute network bonus based on user level
async function distributeNetworkBonus(userId: string, profitAmount: number, tradingDate?: Date): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        referrerId: true,
        level: true,
        balance: true,
      },
    });

    if (!user?.referrerId) {
      return 0; // No upline, no bonus to distribute
    }

    // Get configurable level bonus percentages
    const { getLevelBonusPercentages, getRankConfig } = await import('../utils/rank.util');
    const levelBonuses = await getLevelBonusPercentages();

    // Get the SOURCE user's profit share config to calculate company share correctly
    const sourceUserConfig = getRankConfig(user.level as any);
    const sourceUserShare = sourceUserConfig.profitShareUser / 100;
    const sourceCompanyShare = sourceUserConfig.profitShareCompany / 100;
    
    // Calculate the company's portion from the source user's profit
    // If user got profitAmount with their share %, company's portion would be:
    // companyPortion = (profitAmount / userShare) * companyShare
    const companyPortion = (profitAmount / sourceUserShare) * sourceCompanyShare;

    let totalDistributed = 0;
    let currentReferrerId: string | null = user.referrerId;
    let currentLevel = 1;
    const maxLevels = 10;
    
    // Store bonus details for the source user
    const bonusDetails: any = {};

    while (currentReferrerId && currentLevel <= maxLevels) {
      const uplineUserData: {
        id: string;
        level: string;
        balance: number;
        referrerId: string | null;
      } | null = await prisma.user.findUnique({
        where: { id: currentReferrerId },
        select: {
          id: true,
          level: true,
          balance: true,
          referrerId: true,
        },
      });

      if (!uplineUserData) break;

      // Store values to avoid circular reference
      const uplineId: string = uplineUserData.id;
      const uplineLevel: string = uplineUserData.level;
      const uplineBalance: number = uplineUserData.balance;
      const nextReferrerId: string | null = uplineUserData.referrerId;

      // Check if upline is eligible for this level bonus
      const { isEligibleForLevelBonus } = await import('../utils/rank.util');
      const isEligible = isEligibleForLevelBonus(uplineLevel as any, currentLevel);
      
      if (isEligible) {
        // Get the bonus percentage for this level from config
        const levelBonus = levelBonuses.find(b => b.level === currentLevel);
        if (!levelBonus) continue;
        
        const bonusRate = levelBonus.percentage / 100;
        
        // Calculate bonus from the SOURCE user's company share portion
        const bonusAmount = companyPortion * bonusRate;

        // Update upline's balance and recalculate rank
        const newBalance = uplineBalance + bonusAmount;
        
        // Check if testnet mode for rank calculation
        const network = process.env.DEPOSIT_NETWORK || 'Sepolia Testnet';
        const isTestnet = network.toLowerCase().includes('test') || 
                          network.toLowerCase().includes('sepolia') || 
                          network.toLowerCase().includes('goerli');
        
        const newRank = calculateRankFromBalance(newBalance, isTestnet);
        
        await prisma.user.update({
          where: { id: uplineId },
          data: {
            balance: newBalance,
            level: newRank,
          },
        });

        // Record bonus history with detailed info
        await prisma.bonusHistory.create({
          data: {
            userId: uplineId,
            bonusAmount,
            bonusType: 'NETWORK_LEVEL_BONUS',
            sourceUserId: userId,
            level: currentLevel,
            calculatedFrom: profitAmount,
            tradingDate: tradingDate || new Date(),
            bonusDetails: JSON.stringify({
              level: currentLevel,
              percentage: levelBonus.percentage,
              sourceProfit: profitAmount,
            }),
            description: `Level ${currentLevel} bonus (${levelBonus.percentage}%)`,
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: uplineId,
            amount: bonusAmount,
            type: 'BONUS',
            status: 'COMPLETED',
            remarks: `Level ${currentLevel} network bonus (${levelBonus.percentage}%)`,
          },
        });

        totalDistributed += bonusAmount;
        bonusDetails[`level${currentLevel}`] = bonusAmount;
      }

      // Move to next level
      currentReferrerId = nextReferrerId || null;
      currentLevel++;
    }

    return totalDistributed;
  } catch (error) {
    console.error('Distribute network bonus error:', error);
    return 0;
  }
}

export const distributeBonus = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        balance: true,
        totalDeposit: true,
      },
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

export const getRankingLevels = async (req: AuthRequest, res: Response) => {
  try {
    // Get all ranking level configurations from SystemConfig
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'RANK_',
        },
      },
      orderBy: { key: 'asc' },
    });

    // Parse the configurations
    const levels = configs.map(config => {
      const value = JSON.parse(config.value);
      return {
        key: config.key,
        ...value,
        description: config.description,
      };
    });

    res.json(levels);
  } catch (error) {
    console.error('Get ranking levels error:', error);
    res.status(500).json({ error: 'Failed to fetch ranking levels' });
  }
};

export const updateRankingLevel = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { levelName, minDeposit, bonusPercentage, bonusLevels, description } = req.body;

    if (!levelName || minDeposit === undefined) {
      return res.status(400).json({ error: 'Level name and minimum deposit are required' });
    }

    const key = `RANK_${levelName.toUpperCase()}`;
    const value = JSON.stringify({
      levelName,
      minDeposit: parseFloat(minDeposit),
      bonusPercentage: parseFloat(bonusPercentage || 0),
      bonusLevels: parseInt(bonusLevels || 0),
    });

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value,
        description: description || `Ranking level: ${levelName}`,
      },
      create: {
        key,
        value,
        description: description || `Ranking level: ${levelName}`,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'UPDATE_RANKING_LEVEL',
        details: `Updated ranking level: ${levelName}`,
      },
    });

    res.json({
      message: 'Ranking level updated successfully',
      config,
    });
  } catch (error) {
    console.error('Update ranking level error:', error);
    res.status(500).json({ error: 'Failed to update ranking level' });
  }
};

export const exportWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const statusParam = (req.query.status as string) || 'PENDING';
    const adminId = req.userId!;

    // Get withdrawal requests
    const withdrawals = await prisma.transaction.findMany({
      where: {
        type: 'WITHDRAWAL',
        status: statusParam as any,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format data as CSV (Excel-compatible)
    const csvHeader = 'Transaction ID,Date,Username,Email,Phone,Level,Wallet Address,Amount (USDT),Status,Remarks\n';
    const csvRows = withdrawals.map(tx => {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      return [
        tx.id,
        date,
        tx.user.username,
        tx.user.email,
        tx.user.phone,
        tx.user.level,
        tx.walletAddress || '',
        tx.amount.toFixed(2),
        tx.status,
        (tx.remarks || '').replace(/,/g, ';'), // Replace commas in remarks
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'EXPORT_WITHDRAWALS',
        details: `Exported ${withdrawals.length} ${statusParam} withdrawal requests`,
      },
    });

    // Set headers for file download
    const filename = `withdrawals_${statusParam.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export withdrawals error:', error);
    res.status(500).json({ error: 'Failed to export withdrawals' });
  }
};

export const getMemberNetworkTree = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        balance: true,
        totalDeposit: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build network tree with full details
    const networkTree = await buildAdminNetworkTree(userId, 10);

    res.json({
      user,
      networkTree,
    });
  } catch (error) {
    console.error('Get member network tree error:', error);
    res.status(500).json({ error: 'Failed to fetch member network tree' });
  }
};

export const getMemberDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        level: true,
        balance: true,
        totalDeposit: true,
        referralCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transactions history
    const deposits = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'DEPOSIT',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const withdrawals = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'WITHDRAWAL',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get profit history
    const profits = await prisma.profitHistory.findMany({
      where: { userId },
      orderBy: { tradingDate: 'desc' },
      take: 50,
    });

    // Get bonus history
    const bonuses = await prisma.bonusHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get direct referrals count
    const directReferrals = await prisma.user.count({
      where: { referrerId: userId },
    });

    res.json({
      user,
      deposits,
      withdrawals,
      profits,
      bonuses,
      directReferrals,
    });
  } catch (error) {
    console.error('Get member details error:', error);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
};

export const adjustUserBalance = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId!;
    const { userId } = req.params;
    const { amount, type, reason } = req.body;

    if (!amount || !type || !reason) {
      return res.status(400).json({ error: 'Amount, type, and reason are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        level: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const adjustmentAmount = parseFloat(amount);
    const newBalance = type === 'ADD' ? user.balance + adjustmentAmount : user.balance - adjustmentAmount;

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance for deduction' });
    }

    // Update user balance
    await prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: type === 'ADD' ? adjustmentAmount : -adjustmentAmount,
        type: 'ADJUSTMENT',
        status: 'COMPLETED',
        remarks: `Manual ${type === 'ADD' ? 'addition' : 'deduction'} by admin: ${reason}`,
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        actionType: 'ADJUST_BALANCE',
        targetId: userId,
        details: `${type === 'ADD' ? 'Added' : 'Deducted'} ${adjustmentAmount} USDT ${type === 'ADD' ? 'to' : 'from'} ${user.username}. Reason: ${reason}`,
      },
    });

    res.json({
      message: 'Balance adjusted successfully',
      newBalance,
      adjustment: type === 'ADD' ? adjustmentAmount : -adjustmentAmount,
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ error: 'Failed to adjust balance' });
  }
};

export const getRecentTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, type, userId } = req.query;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (userId) {
      where.userId = userId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            level: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
};

// Helper function to build network tree for admin view
async function buildAdminNetworkTree(userId: string, maxLevel: number) {
  const buildLevel = async (id: string, currentLevel: number): Promise<any> => {
    if (currentLevel >= maxLevel) return null;

    const referrals = await prisma.user.findMany({
      where: { referrerId: id },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        totalDeposit: true,
        level: true,
        createdAt: true,
      },
    });

    if (referrals.length === 0) return [];

    const children = await Promise.all(
      referrals.map(async (ref) => ({
        ...ref,
        children: await buildLevel(ref.id, currentLevel + 1),
      }))
    );

    return children;
  };

  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      balance: true,
      totalDeposit: true,
      level: true,
      createdAt: true,
    },
  });

  return {
    ...rootUser,
    children: await buildLevel(userId, 0),
  };
}
