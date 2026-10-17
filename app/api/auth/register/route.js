import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '../../../../src/lib/db';
import { apiError, readJson } from '../../../../src/lib/api';
import { createToken } from '../../../../src/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { name, email, password } = await readJson(request);
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!cleanName || !cleanEmail || typeof password !== 'string' || !password) {
      return NextResponse.json(
        { message: 'Name, email and password are required.' },
        { status: 400 },
      );
    }
    if (cleanName.length > 100 || cleanEmail.length > 190) {
      return NextResponse.json(
        { message: 'Name or email is too long.' },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { message: 'Enter a valid email address.' },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must contain at least 8 characters.' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users(name, email, password_hash)
       VALUES($1, $2, $3)
       RETURNING id, name, email, role`,
      [cleanName, cleanEmail, passwordHash],
    );
    const user = rows[0];

    return NextResponse.json(
      { user, token: createToken(user) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
