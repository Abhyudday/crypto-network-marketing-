import { Router } from 'express';
import { 
  getDepositWallet, 
  updateDepositWallet, 
  getAllConfig 
} from '../controllers/config.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public route - anyone can get deposit wallet
router.get('/deposit-wallet', getDepositWallet);

// Admin routes
router.put('/deposit-wallet', authenticate, requireAdmin, updateDepositWallet);
router.get('/all', authenticate, requireAdmin, getAllConfig);

export default router;
