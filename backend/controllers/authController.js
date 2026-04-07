import bcrypt from 'bcryptjs';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createUser, findUserByEmail, findUserById } from '../models/userModel.js';
import { createSession, getValidSession, revokeSession } from '../models/sessionModel.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../services/tokenService.js';

const REFRESH_COOKIE = 'refreshToken';

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;
  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already used' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ username, email: email.toLowerCase(), passwordHash, role: role || 'viewer' });
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const safeUser = { id: user.id, username: user.username, role: user.role };
  const accessToken = signAccessToken(safeUser);
  const refreshToken = signRefreshToken(safeUser);
  const expiresAt = new Date(Date.now() + Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30) * 24 * 60 * 60 * 1000);
  await createSession({
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: req.get('user-agent') || '',
    ip: req.ip
  });

  res.cookie(REFRESH_COOKIE, refreshToken, { httpOnly: true, sameSite: 'lax', secure: false });
  res.json({ accessToken, user: await findUserById(user.id) });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (!refreshToken) return res.status(401).json({ error: 'Missing refresh token' });
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  const session = await getValidSession(payload.sub, hashToken(refreshToken));
  if (!session) return res.status(401).json({ error: 'Session expired' });

  const user = await findUserById(payload.sub);
  const accessToken = signAccessToken({ id: user.id, username: user.username, role: user.role });
  res.json({ accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_COOKIE];
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await revokeSession(payload.sub, hashToken(refreshToken));
    } catch {
      // ignore invalid token
    }
  }
  res.clearCookie(REFRESH_COOKIE);
  res.json({ ok: true });
});
