// src/api/files.ts
import { BASE_URL } from './baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Picked = { uri: string; name?: string; type?: string };

async function getToken() {
  const keys = ['auth.token', 'accessToken', 'token', 'auth.accessToken'];
  for (const k of keys) {
    const v = await AsyncStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export async function uploadFile(file: Picked): Promise<string> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name ?? 'upload.bin',
    type: file.type ?? 'application/octet-stream',
  } as any);

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/api/files`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form, // boundary 자동
  });

  const text = await res.text().catch(() => '');
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  const code = json?.code ?? (res.ok ? 200 : res.status);
  if (!res.ok || code >= 400) {
    const msg = json?.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // { code, data: { url } } | { code, data: "/static/..." }
  const url = json?.data?.url ?? json?.data ?? json?.url ?? null;
  if (!url || typeof url !== 'string') {
    throw new Error('업로드 응답에 url이 없습니다.');
  }
  return url;
}
