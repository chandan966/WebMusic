import { NextResponse } from 'next/server';
import { pool } from '../../../src/lib/db';
import { apiError, readJson } from '../../../src/lib/api';
import { requireAuth } from '../../../src/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const user = requireAuth(request);
    const { rows } = await pool.query(
      `SELECT p.*, COUNT(pt.track_id)::int AS track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [user.id],
    );
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request);
    const body = await readJson(request);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json(
        { message: 'Playlist name is required.' },
        { status: 400 },
      );
    }

    const description =
      typeof body.description === 'string' ? body.description.slice(0, 500) : '';
    const { rows } = await pool.query(
      `INSERT INTO playlists(user_id, name, description)
       VALUES($1, $2, $3)
       RETURNING id, name, description, created_at`,
      [user.id, name.slice(0, 120), description],
    );
    return NextResponse.json(
      { ...rows[0], track_count: 0 },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
