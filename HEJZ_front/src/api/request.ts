// src/api/request.ts
import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';

// 앱 부팅 후 최초 1번만 베이스 URL 로그
let __loggedBase = false;
function logBaseOnce() {
  if (!__loggedBase) {
    console.log('[API] BASE_URL =>', BASE_URL);
    __loggedBase = true;
  }
}

type Opts = {
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  body?: any; // object | FormData
  params?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
};

/**
 * fetch 래퍼
 * - BASE_URL + path(+query)
 * - FormData면 Content-Type 자동 지정하지 않음 (boundary 자동)
 * - 서버 래퍼: ApiResponse{ code, data, message } → data만 반환
 */

export async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  logBaseOnce();

  const { method='GET', body, params, headers={}, timeoutMs=15000, signal } = opts;

  const qs = params
    ? '?' + Object.entries(params)
        .filter(([,v]) => v!==undefined && v!==null && v!=='')
        .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const isAbsolute = /^https?:\/\//i.test(path);
  const url = `${isAbsolute ? '' : BASE_URL}${path}${qs}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const finalHeaders: Record<string,string> = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && finalHeaders['Content-Type'] == null) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  // ⬇⬇⬇ 토큰 자동 주입
  const token = await getToken();
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: signal ?? ctrl.signal,
    });

    const raw = await res.text();
    const json = raw ? safeJson(raw) : null;

    if (!res.ok) {
      const message = json?.message || `HTTP ${res.status}`;
      const err: any = new Error(message);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return (json?.data ?? json) as T;
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(t: string) { try { return JSON.parse(t); } catch { return null; } }
