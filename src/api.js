const API = '/api';

export function getToken() {
  return typeof window === 'undefined'
    ? null
    : localStorage.getItem('webmusic_token');
}

export async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || 'Request failed');
  }

  return body;
}
