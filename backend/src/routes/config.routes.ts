import { Router } from 'express';
import { 
  getDepositWallet, 
  updateDepositWallet, 
  getAllConfig,
  getWithdrawalStatus,
  toggleWithdrawal,
  updateConfig
} from '../controllers/config.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/deposit-wallet', getDepositWallet);
router.get('/withdrawal-status', getWithdrawalStatus);

// Admin routes
router.put('/deposit-wallet', authenticate, requireAdmin, updateDepositWallet);
router.get('/all', authenticate, requireAdmin, getAllConfig);
router.post('/withdrawal-toggle', authenticate, requireAdmin, toggleWithdrawal);
router.put('/update', authenticate, requireAdmin, updateConfig);

export default router;
