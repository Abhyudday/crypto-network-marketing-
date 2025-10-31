import crypto from 'crypto';

export const generateReferralCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const getLevelRequirement = (level: string): number => {
  const requirements: { [key: string]: number } = {
    STARTER: 100,
    BEGINNER: 500,
    INVESTOR: 1000,
    VIP: 5000,
    VVIP: 10000,
  };
  return requirements[level] || 0;
};

export const getLevelBonusLevels = (level: string): number => {
  const bonusLevels: { [key: string]: number } = {
    STARTER: 0,
    BEGINNER: 3,
    INVESTOR: 7,
    VIP: 10,
    VVIP: 10,
  };
  return bonusLevels[level] || 0;
};

export const getVVIPWholeTreeBonus = (): number => {
  return 0.05; // 5%
};
