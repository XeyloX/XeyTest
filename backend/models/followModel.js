import { query } from '../db/index.js';

export async function followStreamer(followerId, streamerId) {
  await query('INSERT INTO followers (follower_id, streamer_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [followerId, streamerId]);
}

export async function unfollowStreamer(followerId, streamerId) {
  await query('DELETE FROM followers WHERE follower_id=$1 AND streamer_id=$2', [followerId, streamerId]);
}

export async function getFollowers(streamerId) {
  const { rows } = await query('SELECT follower_id FROM followers WHERE streamer_id=$1', [streamerId]);
  return rows.map((r) => r.follower_id);
}

export async function getFollowerCount(streamerId) {
  const { rows } = await query('SELECT COUNT(*)::int AS count FROM followers WHERE streamer_id=$1', [streamerId]);
  return rows[0]?.count || 0;
}
