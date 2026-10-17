import { NextResponse } from 'next/server';
import { pool } from '../../../../src/lib/db';
import { apiError } from '../../../../src/lib/api';
import { requireAuth } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const user = requireAuth(request);
    const { rows } = await pool.query(
      `SELECT t.* FROM tracks t
       JOIN liked_tracks l ON l.track_id = t.id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [user.id],
    );
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}
