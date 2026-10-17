import { NextResponse } from 'next/server';
import { pool } from '../../../../src/lib/db';
import { ApiError, apiError, readJson } from '../../../../src/lib/api';
import { requireAdmin } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

function validateTrack(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const artist = typeof body.artist === 'string' ? body.artist.trim() : '';
  const album =
    typeof body.album === 'string' && body.album.trim()
      ? body.album.trim()
      : 'Single';
  const genre =
    typeof body.genre === 'string' && body.genre.trim()
      ? body.genre.trim()
      : 'Pop';
  const audioUrl =
    typeof body.audio_url === 'string' ? body.audio_url.trim() : '';
  const coverUrl =
    typeof body.cover_url === 'string' ? body.cover_url.trim() : '';
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

export async function GET(request) {
  try {
    await requireAdmin(request);
    const { rows } = await pool.query(
      'SELECT * FROM tracks ORDER BY id DESC LIMIT 500',
    );
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request) {
  try {
    await requireAdmin(request);
    const track = validateTrack(await readJson(request));
    const { rows } = await pool.query(
      `INSERT INTO tracks(title, artist, album, cover_url, audio_url, duration_seconds, genre)
       VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        track.title,
        track.artist,
        track.album,
        track.coverUrl || null,
        track.audioUrl,
        track.duration,
        track.genre,
      ],
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
