import { NextResponse } from 'next/server';
import { pool } from '../../../../../src/lib/db';
import { ApiError, apiError, readJson } from '../../../../../src/lib/api';
import { requireAdmin } from '../../../../../src/lib/auth';

export const runtime = 'nodejs';

function validateId(id) {
  if (!/^\d+$/.test(id) || id === '0') {
    throw new ApiError('Song not found.', 404);
  }
}

function validateTrack(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const artist = typeof body.artist === 'string' ? body.artist.trim() : '';
  const album = typeof body.album === 'string' ? body.album.trim() || 'Single' : 'Single';
  const genre = typeof body.genre === 'string' ? body.genre.trim() || 'Pop' : 'Pop';
  const audioUrl = typeof body.audio_url === 'string' ? body.audio_url.trim() : '';
  const coverUrl = typeof body.cover_url === 'string' ? body.cover_url.trim() : '';
  const duration = Number(body.duration_seconds || 0);
  const isHttpsUrl = (value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (!title || !artist || !audioUrl) {
    throw new ApiError('Song title, artist, and audio or Spotify URL are required.');
  }
  if (title.length > 180 || artist.length > 180 || album.length > 180 || genre.length > 80) {
    throw new ApiError('One or more song fields exceed the allowed length.');
  }
  if (
    (!audioUrl.startsWith('/audio/') && !isHttpsUrl(audioUrl)) ||
    (coverUrl && !isHttpsUrl(coverUrl))
  ) {
    throw new ApiError('Use a local /audio/ path or an HTTPS audio/Spotify URL.');
  }
  if (!Number.isInteger(duration) || duration < 0 || duration > 86400) {
    throw new ApiError('Duration must be a number of seconds from 0 to 86400.');
  }
  return { title, artist, album, genre, audioUrl, coverUrl, duration };
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    validateId(id);
    const track = validateTrack(await readJson(request));
    const { rows } = await pool.query(
      `UPDATE tracks
       SET title = $1, artist = $2, album = $3, cover_url = $4,
           audio_url = $5, duration_seconds = $6, genre = $7
       WHERE id = $8 RETURNING *`,
      [
        track.title,
        track.artist,
        track.album,
        track.coverUrl || null,
        track.audioUrl,
        track.duration,
        track.genre,
        id,
      ],
    );
    if (!rows.length) throw new ApiError('Song not found.', 404);
    return NextResponse.json(rows[0]);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    validateId(id);
    const { rowCount } = await pool.query('DELETE FROM tracks WHERE id = $1', [id]);
    if (!rowCount) throw new ApiError('Song not found.', 404);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
