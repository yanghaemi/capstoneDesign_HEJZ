import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';

type Json = Record<string, any> | any[] | null;

export function buildURL(path: string, params?: Record<string, any> | null) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  if (!params) return `${base}${p}`;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const q = qs.toString();
  return `${base}${p}${q ? `?${q}` : ''}`;
}

export async function authFetch(
  path: string,
  init?: RequestInit & { params?: Record<string, any> | null; tag?: string }
) {
  const token = await getToken();
  const { params, headers, tag, ...rest } = init ?? {};
  const url = buildURL(path, params);

  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(headers as any),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, { ...rest, headers: h });
    const raw = await res.text().catch(() => '');

    let json: Json = null;
    try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }

    if (!res.ok) {
      // ★ 실패 상세 로그
      console.log('[authFetch:ERROR]', { tag, url, status: res.status, raw });
      const msg =
        (json && (json as any).message) ||
        raw ||
        `HTTP ${res.status} ${res.statusText}`;
      const err: any = new Error(msg);
      err.status = res.status;
      err.body = json ?? raw;
      err.url = url;
      err.tag = tag;
      throw err;
    }

    const data = (json && (json as any).data != null) ? (json as any).data : json;
    // 성공 로그 (원하면 주석)
    // console.log('[authFetch:OK]', { tag, url, hasData: !!data });
    return data;
  } catch (e: any) {
    // 네트워크 자체 실패
    if (!e?.status) {
      console.log('[authFetch:NETWORK_FAIL]', { tag, url, message: e?.message });
    }
    throw e;
  }
}
