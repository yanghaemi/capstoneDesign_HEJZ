// src/api/auth.ts
import { BASE_URL } from './baseUrl';

export async function signUp(req: any) {
  const res = await fetch(`${BASE_URL}/api/user/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`${res.status} ${text}`.trim());
  try { return JSON.parse(text); } catch { return {}; }
}

export async function login(req: { username: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(`${res.status} ${text}`.trim());
  try { return JSON.parse(text); } catch { return {}; }
}
