import { Router } from 'express';
import { body, query } from 'express-validator';
import { getLive, listLive, startStream, stopStream } from '../controllers/streamController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.get('/live', query('page').optional().isInt({ min: 1 }), validate, listLive);
router.get('/live/:streamId', getLive);
router.post('/start', requireAuth, body('title').isLength({ min: 3, max: 120 }), body('category').isLength({ min: 2, max: 60 }), validate, startStream);
router.post('/stop/:streamId', requireAuth, stopStream);

export default router;
