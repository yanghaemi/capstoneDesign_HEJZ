import { BASE_URL } from './baseUrl';

export async function uploadMedia(file:{ uri:string; name:string; type:string }): Promise<string> {
  const form = new FormData();
  form.append('file', file as any);

  const res = await fetch(`${BASE_URL}/api/files`, { method:'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || '업로드 실패');
  return json?.data?.url ?? json?.url; // 서버 응답 구조에 맞춰 둘 중 하나
}
