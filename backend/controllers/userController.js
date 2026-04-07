import { asyncHandler } from '../middleware/asyncHandler.js';
import { findUserById, listFollowing } from '../models/userModel.js';
import { getStreamHistory } from '../models/streamModel.js';

export const profile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const history = await getStreamHistory(req.user.sub);
  res.json({ user, streamHistory: history });
});

export const following = asyncHandler(async (req, res) => {
  const rows = await listFollowing(req.user.sub);
  res.json({ following: rows });
});
