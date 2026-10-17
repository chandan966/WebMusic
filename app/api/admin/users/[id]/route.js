import { NextResponse } from 'next/server';
import { pool } from '../../../../../src/lib/db';
import { ApiError, apiError, readJson } from '../../../../../src/lib/api';
import { requireAdmin } from '../../../../../src/lib/auth';

export const runtime = 'nodejs';

function validateId(id) {
  if (!/^\d+$/.test(id) || id === '0') {
    throw new ApiError('User not found.', 404);
  }
}

export async function PATCH(request, { params }) {
  let client;
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    validateId(id);
    const body = await readJson(request);
    if (!['user', 'admin'].includes(body.role)) {
      throw new ApiError('Role must be user or admin.');
    }
    if (String(admin.id) === id && body.role !== 'admin') {
      throw new ApiError('You cannot remove your own admin role.', 409);
    }

    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(771204)');
    const { rows: currentRows } = await client.query(
      'SELECT id, role FROM users WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!currentRows.length) throw new ApiError('User not found.', 404);
    if (currentRows[0].role === 'admin' && body.role === 'user') {
      const { rows: admins } = await client.query(
        "SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin'",
      );
      if (admins[0].total <= 1) {
        throw new ApiError('The last administrator cannot be demoted.', 409);
      }
    }
    const { rows } = await client.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
      [body.role, id],
    );
    await client.query('COMMIT');
    return NextResponse.json(rows[0]);
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Admin user update rollback failed:', rollbackError);
      }
    }
    return apiError(error);
  } finally {
    client?.release();
  }
}

export async function DELETE(request, { params }) {
  let client;
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    validateId(id);
    if (String(admin.id) === id) {
      throw new ApiError('You cannot delete your own administrator account.', 409);
    }

    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(771204)');
    const { rows: currentRows } = await client.query(
      'SELECT id, role FROM users WHERE id = $1 FOR UPDATE',
      [id],
    );
    if (!currentRows.length) throw new ApiError('User not found.', 404);
    if (currentRows[0].role === 'admin') {
      const { rows: admins } = await client.query(
        "SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin'",
      );
      if (admins[0].total <= 1) {
        throw new ApiError('The last administrator cannot be deleted.', 409);
      }
    }
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Admin user deletion rollback failed:', rollbackError);
      }
    }
    return apiError(error);
  } finally {
    client?.release();
  }
}
