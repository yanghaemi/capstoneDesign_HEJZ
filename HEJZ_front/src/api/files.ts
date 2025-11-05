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

export async function uploadFile(file: Picked, timeoutMs = 300000): Promise<string> {
  console.log('[uploadFile] 업로드 시작:', {
    uri: file.uri?.substring(0, 50),
    name: file.name,
    type: file.type,
    baseUrl: BASE_URL,
  });

  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name ?? 'upload.bin',
    type: file.type ?? 'application/octet-stream',
  } as any);

  const token = await getToken();
  console.log('[uploadFile] 토큰 존재:', !!token);

  // 🔧 타임아웃 컨트롤러 추가
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.error('[uploadFile] 타임아웃 발생');
    controller.abort();
  }, timeoutMs);

  try {
    const startTime = Date.now();
    console.log(`[uploadFile] fetch 시작: ${BASE_URL}/api/files`);

    const res = await fetch(`${BASE_URL}/api/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
      signal: controller.signal, // 🔧 타임아웃 시그널 추가
    });

    const elapsed = Date.now() - startTime;
    console.log(`[uploadFile] 응답 도착 (${elapsed}ms):`, res.status, res.statusText);

    const text = await res.text().catch((err) => {
      console.error('[uploadFile] 응답 텍스트 읽기 실패:', err);
      return '';
    });

    console.log('[uploadFile] 응답 본문:', text?.substring(0, 200));

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (parseErr) {
      console.error('[uploadFile] JSON 파싱 실패:', parseErr);
    }

    const code = json?.code ?? (res.ok ? 200 : res.status);
    console.log('[uploadFile] 응답 코드:', code);

    if (!res.ok || code >= 400) {
      const msg = json?.message || text || `HTTP ${res.status}`;
      console.error('[uploadFile] 업로드 실패:', msg);
      throw new Error(msg);
    }

    // { code, data: { url } } | { code, data: "/static/..." }
    const url = json?.data?.url ?? json?.data ?? json?.url ?? null;
    console.log('[uploadFile] 추출된 URL:', url);

    if (!url || typeof url !== 'string') {
      console.error('[uploadFile] URL 누락. 전체 응답:', json);
      throw new Error('업로드 응답에 url이 없습니다.');
    }

    console.log('[uploadFile] 업로드 성공:', url);
    return url;

  } catch (err: any) {
    console.error('[uploadFile] 에러 발생:', err);
    console.error('[uploadFile] 에러 타입:', err?.name);
    console.error('[uploadFile] 에러 메시지:', err?.message);

    if (err?.name === 'AbortError') {
      throw new Error(`파일 업로드 시간 초과 (${timeoutMs / 1000}초)`);
    }
    throw err;

  } finally {
    clearTimeout(timeout);
  }
}