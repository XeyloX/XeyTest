import { query } from '../db/index.js';

export async function createStream({ streamerId, title, category }) {
  const { rows } = await query(
    'INSERT INTO streams (streamer_id, title, category, status) VALUES ($1,$2,$3,\'live\') RETURNING *',
    [streamerId, title, category]
  );
  return rows[0];
}

export async function endStream(streamId, streamerId) {
  const { rows } = await query(
    'UPDATE streams SET status=\'ended\', ended_at=NOW(), viewer_count=0 WHERE id=$1 AND streamer_id=$2 RETURNING *',
    [streamId, streamerId]
  );
  return rows[0];
}

export async function getLiveStreamById(streamId) {
  const { rows } = await query(
    `SELECT s.*, u.username AS streamer_username
     FROM streams s JOIN users u ON u.id=s.streamer_id
     WHERE s.id=$1 AND s.status='live'`,
    [streamId]
  );
  return rows[0];
}

export async function listLiveStreams({ category, sort = 'viewer_count', page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const allowSort = ['viewer_count', 'started_at'];
  const sortBy = allowSort.includes(sort) ? sort : 'viewer_count';
  const params = [];
  let where = "WHERE s.status='live'";
  if (category) {
    params.push(category);
    where += ` AND s.category=$${params.length}`;
  }
  params.push(pageSize, offset);
  const { rows } = await query(
    `SELECT s.*, u.username AS streamer_username
      FROM streams s JOIN users u ON u.id=s.streamer_id
      ${where}
      ORDER BY s.${sortBy} DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

export async function updateViewerCount(streamId, count) {
  await query('UPDATE streams SET viewer_count=$2 WHERE id=$1', [streamId, count]);
}

export async function getStreamHistory(userId) {
  const { rows } = await query('SELECT * FROM streams WHERE streamer_id=$1 ORDER BY started_at DESC LIMIT 50', [userId]);
  return rows;
}
