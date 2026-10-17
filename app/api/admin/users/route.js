import { NextResponse } from 'next/server';
import { pool } from '../../../../src/lib/db';
import { apiError } from '../../../../src/lib/api';
import { requireAdmin } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    await requireAdmin(request);
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users ORDER BY created_at DESC LIMIT 500`,
    );
    return NextResponse.json(rows);
  } catch (error) {
    return apiError(error);
  }
}
