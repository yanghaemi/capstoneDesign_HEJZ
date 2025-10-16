// src/api/search.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

export type ApiResponse<T = any> = { code: number; data: T; message?: string; msg?: string };

async function getAuthToken(): Promise<string | null> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [, val] of pairs) if (val) return val;
  return null;
}

function buildQS(obj: Record<string, any>) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

export async function searchAll(params: { keyword: string; scope?: string; limit?: number }) {
  const { keyword, scope, limit } = params;
  const token = await getAuthToken();

  // ✅ 백엔드가 최소 keyword만 받으면 이것만 보내도 OK
  const url = `${BASE_URL}/api/search?` + buildQS({
    keyword,
    ...(scope ? { scope } : {}),
    ...(limit ? { limit } : {}),
  });

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`검색 실패 (${res.status}) ${text}`.trim());
  }

  const json: ApiResponse = await res.json();
  if (typeof json?.code === 'number' && json.code !== 200) {
    throw new Error(json?.message || json?.msg || '검색 응답 에러');
  }
  return json.data; // ⬅️ 배열 또는 객체 그대로 돌려줌
}
