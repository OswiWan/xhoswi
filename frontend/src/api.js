const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';
const CATALOG_URL = import.meta.env.VITE_CATALOG_URL || 'http://localhost:3002';

export async function register(email, password) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'register failed');
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'login failed');
  return res.json();
}

export async function getMe(token) {
  const res = await fetch(`${AUTH_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('not authenticated');
  return res.json();
}

export async function getVideos() {
  const res = await fetch(`${CATALOG_URL}/videos`);
  if (!res.ok) throw new Error('failed to load catalog');
  return res.json();
}

export async function createVideo(token, video) {
  const res = await fetch(`${CATALOG_URL}/videos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(video),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'create failed');
  return res.json();
}

export async function deleteVideo(token, id) {
  const res = await fetch(`${CATALOG_URL}/videos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error((await res.json()).error || 'delete failed');
  }
}
