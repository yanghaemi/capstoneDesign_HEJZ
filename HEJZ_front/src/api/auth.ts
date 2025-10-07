// src/api/auth.ts
import { BASE_URL } from './baseUrl';
import { saveToken, clearToken } from '../auth/token';

type ApiWrap<T> = { code?: number; data?: T; message?: string } | T;

type LoginReq = { username: string; password: string };
type LoginRes = { accessToken?: string; token?: string; access_token?: string; refreshToken?: string };

type SignUpReq = {
  username: string;
  password: string;
  // 필요한 필드 더 있으면 여기에 추가
};

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

  const raw = await res.text().catch(() => '');
  let json: ApiWrap<T> | null = null;
  try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }

  if (!res.ok) {
    const msg =
      (json as any)?.message ||
      raw ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // ApiResponse 래퍼면 data, 아니면 그대로 반환
  const payload = (json && typeof json === 'object' && 'data' in (json as any))
    ? (json as any).data
    : json;

  return (payload as T) ?? ({} as T);
}

/** 회원가입 */
export async function signUp(req: SignUpReq) {
  // 백엔드 응답 형식에 맞게 필요하면 반환 타입 지정
  return postJSON<any>('/api/user/signup', req);
}

/** 로그인: 토큰 저장까지 처리 */
export async function login(req: { username: string; password: string }) {
  const res = await fetch(`${BASE_URL}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  const raw = await res.text();
  const json = raw ? JSON.parse(raw) : null;

  if (!res.ok) throw new Error((json?.message || raw || `HTTP ${res.status}`));

  // ApiResponse 래퍼이므로 token은 json.data 에 들어있음
  // data 가 문자열(=토큰)인 케이스 지원
  const token = typeof json?.data === 'string'
    ? json.data
    : (json?.data?.accessToken || json?.data?.token || json?.data?.access_token);

  if (!token) throw new Error('로그인 응답에 토큰이 없습니다.');

  await saveToken(token);
  return { accessToken: token };
}
export async function logoutLocalOnly() {
  await clearToken();              // from ../auth/token
  // 서버 로그아웃 API 쓰면 여기서 호출 추가 가능
}