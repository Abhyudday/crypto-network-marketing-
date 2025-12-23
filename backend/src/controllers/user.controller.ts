import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
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

    // Get network statistics
    const directReferrals = await prisma.user.count({
      where: { referrerId: userId },
    });

    // Get total network balance (10 levels)
    const networkUsers = await getNetworkUsers(userId, 10);
    const totalNetworkBalance = networkUsers.reduce(
      (sum, u) => sum + u.balance,
      0
    );

    // Get whole network balance
    const wholeNetworkUsers = await getAllNetworkUsers(userId);
    const totalWholeNetworkBalance = wholeNetworkUsers.reduce(
      (sum, u) => sum + u.balance,
      0
    );

    // Get yesterday's profit
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayProfit = await prisma.profitHistory.findFirst({
      where: {
        userId,
        tradingDate: {
          gte: yesterday,
        },
      },
      orderBy: { tradingDate: 'desc' },
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get total network bonus
    const totalBonus = await prisma.bonusHistory.aggregate({
      where: { userId },
      _sum: { bonusAmount: true },
    });

    // Get total profit
    const totalProfit = await prisma.profitHistory.aggregate({
      where: { userId },
      _sum: { profitAmount: true },
    });

    // Get today's bonus
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBonus = await prisma.bonusHistory.aggregate({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: { bonusAmount: true },
    });

    res.json({
      user,
      stats: {
        directReferrals,
        totalNetworkBalance,
        totalWholeNetworkBalance,
        yesterdayProfitPercent: yesterdayProfit?.profitPercent || 0,
        totalBonus: totalBonus._sum.bonusAmount || 0,
        totalProfit: totalProfit._sum.profitAmount || 0,
        todayBonus: todayBonus._sum.bonusAmount || 0,
      },
      recentTransactions,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getNetworkTree = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const maxLevel = 10;

    const networkTree = await buildNetworkTreeBFS(userId, maxLevel);

    res.json(networkTree);
  } catch (error) {
    console.error('Network tree error:', error);
    res.status(500).json({ error: 'Failed to fetch network tree' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

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

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getTransactionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { type, page = 1, limit = 20 } = req.query;

    const where: any = { userId };
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

export const getProfitHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const profits = await prisma.profitHistory.findMany({
      where: { userId },
      orderBy: { tradingDate: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.profitHistory.count({ where: { userId } });

    res.json({
      profits,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Profit history error:', error);
    res.status(500).json({ error: 'Failed to fetch profit history' });
  }
};

export const getBonusHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const bonuses = await prisma.bonusHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.bonusHistory.count({ where: { userId } });

    res.json({
      bonuses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Bonus history error:', error);
    res.status(500).json({ error: 'Failed to fetch bonus history' });
  }
};

export const getDailyBonusBreakdown = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { date } = req.query;

    // Convert to GMT+7 timezone for proper date boundary
    const now = new Date();
    const gmt7Offset = 7 * 60;
    const localOffset = now.getTimezoneOffset();
    const totalOffset = gmt7Offset + localOffset;
    const gmt7Now = new Date(now.getTime() + totalOffset * 60 * 1000);

    // Get target date in GMT+7
    let targetDate: Date;
    if (date) {
      targetDate = new Date(date as string);
    } else {
      targetDate = new Date(gmt7Now);
    }
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get bonuses for the specific date using tradingDate
    // Filter by tradingDate to match when profit was distributed
    const bonuses = await prisma.bonusHistory.findMany({
      where: {
        userId,
        tradingDate: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total
    const totalDailyBonus = bonuses.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);

    res.json({
      date: targetDate,
      bonuses,
      totalDailyBonus,
      count: bonuses.length,
    });
  } catch (error) {
    console.error('Daily bonus breakdown error:', error);
    res.status(500).json({ error: 'Failed to fetch daily bonus breakdown' });
  }
};

export const getDirectDownline = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    // Get direct referrals
    const referrals = await prisma.user.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        level: true,
        balance: true,
        totalDeposit: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.user.count({ where: { referrerId: userId } });

    // Get total balance and count for each referral
    const referralsWithStats = await Promise.all(
      referrals.map(async (ref) => {
        // Count their direct referrals
        const directReferralsCount = await prisma.user.count({
          where: { referrerId: ref.id },
        });

        return {
          ...ref,
          directReferralsCount,
        };
      })
    );

    res.json({
      referrals: referralsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get direct downline error:', error);
    res.status(500).json({ error: 'Failed to fetch direct downline' });
  }
};

// Helper functions
async function getNetworkUsers(userId: string, maxLevel: number) {
  const users: any[] = [];
  const queue = [{ id: userId, level: 0 }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;

    if (visited.has(id) || level >= maxLevel) continue;
    visited.add(id);

    const referrals = await prisma.user.findMany({
      where: { referrerId: id },
      select: { id: true, username: true, balance: true },
    });

    users.push(...referrals);

    referrals.forEach((ref) => {
      queue.push({ id: ref.id, level: level + 1 });
    });
  }

  return users;
}

async function getAllNetworkUsers(userId: string) {
  const users: any[] = [];
  const queue = [userId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;

    if (visited.has(id)) continue;
    visited.add(id);

    const referrals = await prisma.user.findMany({
      where: { referrerId: id },
      select: { id: true, username: true, balance: true },
    });

    users.push(...referrals);
    referrals.forEach((ref) => queue.push(ref.id));
  }

  return users;
}

async function buildNetworkTree(userId: string, maxLevel: number) {
  const buildLevel = async (id: string, currentLevel: number): Promise<any> => {
    if (currentLevel >= maxLevel) return null;

    const referrals = await prisma.user.findMany({
      where: { referrerId: id },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        level: true,
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
      level: true,
    },
  });

  return {
    ...rootUser,
    children: await buildLevel(userId, 0),
  };
}

async function buildNetworkTreeBFS(userId: string, maxLevel: number) {
  const rootUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      balance: true,
      level: true,
    },
  });

  if (!rootUser) {
    return null;
  }

  const levels: any[] = [];
  let currentLevelUserIds = [userId];

  for (let levelNum = 1; levelNum <= maxLevel; levelNum++) {
    if (currentLevelUserIds.length === 0) break;

    const referrals = await prisma.user.findMany({
      where: {
        referrerId: { in: currentLevelUserIds },
      },
      select: {
        id: true,
        username: true,
        email: true,
        balance: true,
        level: true,
        referrerId: true,
      },
    });

    if (referrals.length > 0) {
      levels.push({
        level: levelNum,
        count: referrals.length,
        users: referrals.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
          ranking: user.level,
          referrerId: user.referrerId,
        })),
      });

      currentLevelUserIds = referrals.map(r => r.id);
    } else {
      break;
    }
  }

  return {
    root: {
      id: rootUser.id,
      username: rootUser.username,
      email: rootUser.email,
      balance: rootUser.balance,
      ranking: rootUser.level,
    },
    levels,
  };
}
