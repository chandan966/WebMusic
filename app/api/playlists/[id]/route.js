import { NextResponse } from 'next/server';
import { pool } from '../../../../src/lib/db';
import { apiError, ApiError } from '../../../../src/lib/api';
import { requireAuth } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    if (!/^\d+$/.test(id) || id === '0') {
      throw new ApiError('Playlist not found.', 404);
    }
    const { rowCount } = await pool.query(
      'DELETE FROM playlists WHERE id = $1 AND user_id = $2',
      [id, user.id],
    );
    if (!rowCount) {
      return NextResponse.json(
        { message: 'Playlist not found.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
