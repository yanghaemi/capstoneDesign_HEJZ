// src/api/files.ts
import { BASE_URL } from './baseUrl';

export type Picked = { uri: string; name?: string; type?: string };

export async function uploadFile(file: Picked): Promise<string> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name ?? 'upload.bin',        // mp4/jpg 등 확장자 포함 권장
    type: file.type ?? 'application/octet-stream',
  } as any);

  const res = await fetch(`${BASE_URL}/api/files`, {
    method: 'POST',
    // ⚠ Content-Type 수동 지정하지 말 것 (boundary 자동)
    body: form,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(json?.message || text || `HTTP ${res.status}`);

  // { data: { url: "/static/xxx.jpg" } } 형태
  const url = json?.data?.url || json?.data;
  if (!url) throw new Error('업로드 응답에 url이 없습니다.');
  return url as string; // "/static/xxx.jpg"
}
