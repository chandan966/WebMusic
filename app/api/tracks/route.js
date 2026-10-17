import { NextResponse } from 'next/server';
import { pool } from '../../../src/lib/db';
import { apiError } from '../../../src/lib/api';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';
    const result = query
      ? await pool.query(
          `SELECT * FROM tracks
           WHERE title ILIKE $1 OR artist ILIKE $1 OR album ILIKE $1 OR genre ILIKE $1
           ORDER BY id DESC LIMIT 100`,
          [`%${query}%`],
        )
      : await pool.query('SELECT * FROM tracks ORDER BY id DESC LIMIT 100');

    return NextResponse.json(result.rows);
  } catch (error) {
    return apiError(error);
  }
}
