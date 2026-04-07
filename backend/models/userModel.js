import { query } from '../db/index.js';

export async function createUser({ username, email, passwordHash, role }) {
  const { rows } = await query(
    'INSERT INTO users (username, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, username, email, role, bio, avatar_url, created_at',
    [username, email, passwordHash, role]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

export async function findUserById(id) {
  const { rows } = await query(
    `SELECT u.id,u.username,u.email,u.role,u.bio,u.avatar_url,u.created_at,
      (SELECT COUNT(*)::int FROM followers f WHERE f.streamer_id=u.id) AS follower_count,
      (SELECT COUNT(*)::int FROM followers f WHERE f.follower_id=u.id) AS following_count
      FROM users u WHERE u.id = $1`,
    [id]
  );
  return rows[0];
}

export async function listFollowing(userId) {
  const { rows } = await query(
    `SELECT u.id,u.username,u.role FROM followers f JOIN users u ON u.id=f.streamer_id WHERE f.follower_id=$1 ORDER BY u.username`,
    [userId]
  );
  return rows;
}
