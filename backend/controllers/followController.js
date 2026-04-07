import { asyncHandler } from '../middleware/asyncHandler.js';
import { followStreamer, getFollowerCount, unfollowStreamer } from '../models/followModel.js';

export const follow = asyncHandler(async (req, res) => {
  const streamerId = Number(req.params.streamerId);
  await followStreamer(req.user.sub, streamerId);
  res.json({ followerCount: await getFollowerCount(streamerId) });
});

export const unfollow = asyncHandler(async (req, res) => {
  const streamerId = Number(req.params.streamerId);
  await unfollowStreamer(req.user.sub, streamerId);
  res.json({ followerCount: await getFollowerCount(streamerId) });
});
