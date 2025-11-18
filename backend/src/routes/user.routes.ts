import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getDashboard,
  getNetworkTree,
  getProfile,
  getTransactionHistory,
  getProfitHistory,
  getBonusHistory,
  getDailyBonusBreakdown,
  getDirectDownline,
} from '../controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/network-tree', getNetworkTree);
router.get('/direct-downline', getDirectDownline);
router.get('/profile', getProfile);
router.get('/transactions', getTransactionHistory);
router.get('/profit-history', getProfitHistory);
router.get('/bonus-history', getBonusHistory);
router.get('/daily-bonus-breakdown', getDailyBonusBreakdown);

export default router;
