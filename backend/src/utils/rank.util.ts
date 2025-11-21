import { UserLevel, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RankConfig {
  level: UserLevel;
  minBalance: number;
  maxBalance: number;
  bonusLevels: number;
  profitShareUser: number;
  profitShareCompany: number;
  levelName: string;
}

/**
 * Rank configuration based on current balance (not total deposit)
 */
export const RANK_CONFIGS: RankConfig[] = [
  {
    level: UserLevel.STARTER,
    minBalance: 100,
    maxBalance: 499,
    bonusLevels: 0,
    profitShareUser: 50,
    profitShareCompany: 50,
    levelName: 'Starter',
  },
  {
    level: UserLevel.BEGINNER,
    minBalance: 500,
    maxBalance: 999,
    bonusLevels: 3,
    profitShareUser: 55,
    profitShareCompany: 45,
    levelName: 'Beginner',
  },
  {
    level: UserLevel.INVESTOR,
    minBalance: 1000,
    maxBalance: 4999,
    bonusLevels: 7,
    profitShareUser: 60,
    profitShareCompany: 40,
    levelName: 'Investor',
  },
  {
    level: UserLevel.VIP,
    minBalance: 5000,
    maxBalance: 9999,
    bonusLevels: 10,
    profitShareUser: 80,
    profitShareCompany: 20,
    levelName: 'VIP',
  },
  {
    level: UserLevel.VVIP,
    minBalance: 10000,
    maxBalance: Infinity,
    bonusLevels: 10,
    profitShareUser: 80,
    profitShareCompany: 20,
    levelName: 'VVIP',
  },
];

/**
 * Default level bonus percentages (configurable via SystemConfig)
 */
export const DEFAULT_LEVEL_BONUSES = [
  { level: 1, percentage: 20 },
  { level: 2, percentage: 4 },
  { level: 3, percentage: 4 },
  { level: 4, percentage: 4 },
  { level: 5, percentage: 4 },
  { level: 6, percentage: 4 },
  { level: 7, percentage: 4 },
  { level: 8, percentage: 4 },
  { level: 9, percentage: 4 },
  { level: 10, percentage: 4 },
];

/**
 * Calculate user rank based on current balance
 */
export const calculateRankFromBalance = (balance: number, isTestnet: boolean = false): UserLevel => {
  // For testnet, use 1/100th of production values
  const adjustedBalance = isTestnet ? balance * 100 : balance;
  
  if (adjustedBalance >= 10000) return UserLevel.VVIP;
  if (adjustedBalance >= 5000) return UserLevel.VIP;
  if (adjustedBalance >= 1000) return UserLevel.INVESTOR;
  if (adjustedBalance >= 500) return UserLevel.BEGINNER;
  if (adjustedBalance >= 100) return UserLevel.STARTER;
  
  // Below minimum balance, keep as STARTER
  return UserLevel.STARTER;
};

/**
 * Get rank configuration for a specific level
 */
export const getRankConfig = (level: UserLevel): RankConfig => {
  return RANK_CONFIGS.find(config => config.level === level) || RANK_CONFIGS[0];
};

/**
 * Get rank configuration based on balance
 */
export const getRankConfigFromBalance = (balance: number, isTestnet: boolean = false): RankConfig => {
  const level = calculateRankFromBalance(balance, isTestnet);
  return getRankConfig(level);
};

/**
 * Get level bonus percentages from system config or use defaults
 */
export const getLevelBonusPercentages = async (): Promise<{ level: number; percentage: number }[]> => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'LEVEL_BONUS_PERCENTAGES' },
    });
    
    if (config?.value) {
      return JSON.parse(config.value);
    }
  } catch (error) {
    console.error('Error fetching level bonus percentages:', error);
  }
  
  return DEFAULT_LEVEL_BONUSES;
};

/**
 * Update user rank based on current balance
 */
export const updateUserRank = async (userId: string): Promise<UserLevel> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, level: true },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if testnet mode
  const network = process.env.DEPOSIT_NETWORK || 'Sepolia Testnet';
  const isTestnet = network.toLowerCase().includes('test') || 
                    network.toLowerCase().includes('sepolia') || 
                    network.toLowerCase().includes('goerli');
  
  const newLevel = calculateRankFromBalance(user.balance, isTestnet);
  
  // Only update if level changed
  if (newLevel !== user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  }
  
  return newLevel;
};

/**
 * Get profit share percentages for a user level
 */
export const getProfitShareRatio = (level: UserLevel): { user: number; company: number } => {
  const config = getRankConfig(level);
  return {
    user: config.profitShareUser,
    company: config.profitShareCompany,
  };
};

/**
 * Check if user is eligible for level bonuses
 */
export const isEligibleForLevelBonus = (level: UserLevel, bonusLevel: number): boolean => {
  const config = getRankConfig(level);
  return bonusLevel <= config.bonusLevels;
};
