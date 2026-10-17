import jwt from 'jsonwebtoken';
import { ApiError } from './api';
import { pool } from './db';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return secret;
}

export function createToken(user) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '7d' });
}

export function requireAuth(request) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';

  if (!token) {
    throw new ApiError('Sign in to continue.', 401);
  }

  try {
    const user = jwt.verify(token, getJwtSecret());
    if (
      typeof user === 'string' ||
      !user.id ||
      !user.email ||
      !['user', 'admin'].includes(user.role)
    ) {
      throw new Error('Invalid token payload.');
    }
    return user;
  } catch (error) {
    if (error.message === 'JWT_SECRET is not configured.') {
      throw error;
    }
    throw new ApiError('Session expired. Please sign in again.', 401);
  }
}

export async function requireAdmin(request) {
  const user = requireAuth(request);
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [
    user.id,
  ]);
  if (!rows.length || rows[0].role !== 'admin') {
    throw new ApiError('Admin access is required.', 403);
  }
  return user;
}
