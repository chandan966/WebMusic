import { NextResponse } from 'next/server';
import { pool } from '../../../src/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await pool.query('SELECT 1');
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'degraded', database: 'disconnected' },
      { status: 503 },
    );
  }
}
