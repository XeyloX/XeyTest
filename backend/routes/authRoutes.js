import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { login, logout, refresh, register } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true });

router.post(
  '/register',
  authLimiter,
  body('username').isLength({ min: 3, max: 40 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8, max: 72 }),
  body('role').optional().isIn(['viewer', 'streamer', 'admin']),
  validate,
  register
);

router.post('/login', authLimiter, body('email').isEmail(), body('password').isString().isLength({ min: 8 }), validate, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
