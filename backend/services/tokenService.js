import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, username: user.username }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m'
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${process.env.REFRESH_TOKEN_TTL_DAYS || 30}d`
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
