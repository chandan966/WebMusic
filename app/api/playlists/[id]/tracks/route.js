import { NextResponse } from 'next/server';
import { pool } from '../../../../../src/lib/db';
import { apiError, ApiError, readJson } from '../../../../../src/lib/api';
import { requireAuth } from '../../../../../src/lib/auth';

export const runtime = 'nodejs';

async function requireOwnedPlaylist(id, userId) {
  if (!/^\d+$/.test(id) || id === '0') {
    throw new ApiError('Playlist not found.', 404);
  }
  const { rows } = await pool.query(
    'SELECT id FROM playlists WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
  if (!rows.length) {
    throw new ApiError('Playlist not found.', 404);
  }
}

export async function GET(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    await requireOwnedPlaylist(id, user.id);
    const { rows } = await pool.query(
      `SELECT t.* FROM tracks t
       JOIN playlist_tracks pt ON pt.track_id = t.id
       WHERE pt.playlist_id = $1
       ORDER BY pt.added_at DESC`,
      [id],
    );
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const user = requireAuth(request);
    const { id } = await params;
    const body = await readJson(request);
    const trackId = String(body.trackId ?? '');
    if (!/^\d+$/.test(trackId) || trackId === '0') {
      throw new ApiError('Track not found.', 404);
    }

    await requireOwnedPlaylist(id, user.id);
    await pool.query(
      `INSERT INTO playlist_tracks(playlist_id, track_id)
       VALUES($1, $2)
       ON CONFLICT (playlist_id, track_id) DO NOTHING`,
      [id, trackId],
    );
    return NextResponse.json({ added: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
