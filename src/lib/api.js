import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJson(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ApiError('Request body must be valid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError('Request body must be a JSON object.');
  }
  return body;
}

export function apiError(error) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  if (error?.code === '23505') {
    return NextResponse.json(
      { message: 'An account with this email already exists.' },
      { status: 409 },
    );
  }

  if (error?.code === '23503') {
    return NextResponse.json(
      { message: 'The requested track or playlist was not found.' },
      { status: 404 },
    );
  }

  console.error('API request failed:', error);
  return NextResponse.json(
    { message: 'Server error. Check application logs.' },
    { status: 500 },
  );
}
