import { query } from '../db/index.js';

export async function createMessage({ streamId, userId, content }) {
  const { rows } = await query(
    'INSERT INTO messages (stream_id, user_id, content) VALUES ($1,$2,$3) RETURNING id, stream_id, user_id, content, created_at, deleted',
    [streamId, userId, content]
  );
  return rows[0];
}

export async function listMessages(streamId, limit = 50) {
  const { rows } = await query(
    `SELECT m.id,m.stream_id,m.user_id,m.content,m.created_at,m.deleted,u.username
      FROM messages m JOIN users u ON u.id=m.user_id WHERE m.stream_id=$1 ORDER BY m.created_at DESC LIMIT $2`,
    [streamId, limit]
  );
  return rows.reverse();
}

export async function deleteMessage(messageId, streamId) {
  const { rows } = await query('UPDATE messages SET deleted=true, content=\'[deleted]\' WHERE id=$1 AND stream_id=$2 RETURNING *', [messageId, streamId]);
  return rows[0];
}

export async function setTimeoutForUser(streamId, userId, expiresAt) {
  await query(
    'INSERT INTO timeouts (stream_id, user_id, expires_at) VALUES ($1,$2,$3) ON CONFLICT (stream_id,user_id) DO UPDATE SET expires_at = EXCLUDED.expires_at',
    [streamId, userId, expiresAt]
  );
}

export async function isUserTimedOut(streamId, userId) {
  const { rows } = await query('SELECT 1 FROM timeouts WHERE stream_id=$1 AND user_id=$2 AND expires_at > NOW()', [streamId, userId]);
  return rows.length > 0;
}
