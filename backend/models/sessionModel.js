import { query } from '../db/index.js';

export async function createSession({ userId, refreshTokenHash, expiresAt, userAgent = '', ip = '' }) {
  await query(
    'INSERT INTO sessions (user_id, refresh_token_hash, expires_at, user_agent, ip) VALUES ($1,$2,$3,$4,$5)',
    [userId, refreshTokenHash, expiresAt, userAgent, ip]
  );
}

export async function getValidSession(userId, refreshTokenHash) {
  const { rows } = await query(
    'SELECT * FROM sessions WHERE user_id=$1 AND refresh_token_hash=$2 AND expires_at > NOW()',
    [userId, refreshTokenHash]
  );
  return rows[0];
}

export async function revokeSession(userId, refreshTokenHash) {
  await query('DELETE FROM sessions WHERE user_id=$1 AND refresh_token_hash=$2', [userId, refreshTokenHash]);
}
