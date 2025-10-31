import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createDeposit,
  createWithdrawal,
  getMyTransactions,
} from '../controllers/transaction.controller';

const router = Router();

router.use(authenticate);

router.post('/deposit', createDeposit);
router.post('/withdrawal', createWithdrawal);
router.get('/my-transactions', getMyTransactions);

export default router;
