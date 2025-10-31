import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getPendingDeposits,
  getPendingWithdrawals,
  approveDeposit,
  approveWithdrawal,
  rejectTransaction,
  inputTradingResult,
  distributeProfit,
  distributeBonus,
  getAllUsers,
  getAdminStats,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/deposits/pending', getPendingDeposits);
router.get('/withdrawals/pending', getPendingWithdrawals);
router.post('/deposits/:transactionId/approve', approveDeposit);
router.post('/withdrawals/:transactionId/approve', approveWithdrawal);
router.post('/transactions/:transactionId/reject', rejectTransaction);
router.post('/trading-result', inputTradingResult);
router.post('/trading-result/:tradingResultId/distribute', distributeProfit);
router.post('/bonus/:userId/distribute', distributeBonus);

export default router;
