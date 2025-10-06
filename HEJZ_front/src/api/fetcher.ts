// src/api/fetcher.ts
import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token'; // <- 너의 token.ts 경로에 맞춰 수정

export type ApiResponse<T = any> = {
  code: number;
  data: T;
  message?: string;
};

export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // 1) 토큰 읽어서 Authorization 헤더 자동 첨부
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // 2) 요청
  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  // 3) 응답 JSON 파싱 (백엔드가 에러면 4xx/5xx일 수 있음)
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  // 4) 일관된 형태로 반환 (404 등도 그대로 code로 돌려줌)
  if (!res.ok) {
    return {
      code: res.status,
      data: (body?.data ?? null) as T,
      message: body?.message ?? `HTTP ${res.status}`,
    };
  }

  // 백엔드가 ApiResponse 형태라 가정
  // 혹시 아니면 안전하게 감싸서 리턴
  if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
    return body as ApiResponse<T>;
  }
  return { code: 200, data: body as T, message: 'OK' };
}
