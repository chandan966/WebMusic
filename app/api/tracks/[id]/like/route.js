import { NextResponse } from 'next/server';
import { pool } from '../../../../../src/lib/db';
import { apiError, ApiError } from '../../../../../src/lib/api';
import { requireAuth } from '../../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    if (!/^\d+$/.test(id) || id === '0') {
      throw new ApiError('Track not found.', 404);
    }

    const { rows: existing } = await pool.query(
      'SELECT track_id FROM liked_tracks WHERE user_id = $1 AND track_id = $2',
      [user.id, id],
    );
    if (existing.length) {
      await pool.query(
        'DELETE FROM liked_tracks WHERE user_id = $1 AND track_id = $2',
        [user.id, id],
      );
      return NextResponse.json({ liked: false });
    }

    await pool.query(
      `INSERT INTO liked_tracks(user_id, track_id) VALUES($1, $2)
       ON CONFLICT (user_id, track_id) DO NOTHING`,
      [user.id, id],
    );
    return NextResponse.json({ liked: true });
  } catch (error) {
    return apiError(error);
  }
}
