import { Router } from 'express';
import { follow, unfollow } from '../controllers/followController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/:streamerId', requireAuth, follow);
router.delete('/:streamerId', requireAuth, unfollow);

export default router;
