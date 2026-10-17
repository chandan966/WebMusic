import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '../../../../src/lib/db';
import { apiError, readJson } from '../../../../src/lib/api';
import { createToken } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { email, password } = await readJson(request);
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return NextResponse.json(
        { message: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const { rows } = await pool.query(
      `SELECT id, name, email, password_hash, role
       FROM users WHERE email = $1`,
      [email.trim().toLowerCase()],
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return NextResponse.json(
        { message: 'Incorrect email or password.' },
        { status: 401 },
      );
    }

    const { password_hash: _passwordHash, ...user } = rows[0];
    return NextResponse.json({ user, token: createToken(user) });
  } catch (error) {
    return apiError(error);
  }
}
