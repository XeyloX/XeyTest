import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import streamRoutes from './routes/streamRoutes.js';
import followRoutes from './routes/followRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function buildApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/streams', streamRoutes);
  app.use('/api/follows', followRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
