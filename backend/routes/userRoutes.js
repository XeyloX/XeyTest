import { Router } from 'express';
import { following, profile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/me', requireAuth, profile);
router.get('/me/following', requireAuth, following);

export default router;
