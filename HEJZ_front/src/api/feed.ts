// src/api/feed.ts
import { request } from './request';
import type { FeedListResponse, FeedCreateRequest, FeedItemDto } from './types/feed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';
export const fetchMyFeeds = (p:{limit?:number; cursor?:string|null}) =>
  request<FeedListResponse>('/api/feeds/me', { params: { limit:p.limit ?? 20, cursor:p.cursor ?? undefined } });

export const createFeed = (body: FeedCreateRequest) =>
  request<FeedItemDto>('/api/feeds', { method:'POST', body });

export const deleteFeed = (feedId: number) =>
  request<null>(`/api/feeds/${feedId}`, { method:'DELETE' });

// 🔥 타인 피드 조회 추가
export async function fetchUserFeeds(username: string, limit: number = 20, cursor?: string): Promise<FeedListResponse> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  const token = pairs.find(([, v]) => !!v)?.[1] ?? null;

  console.log('[fetchUserFeeds] username:', username);
  console.log('[fetchUserFeeds] token exists?', !!token);

  const queryParams = new URLSearchParams({
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });

  const url = `${BASE_URL}/api/feeds/user/${username}?${queryParams}`; // ✅ feeds (복수형)
  console.log('[fetchUserFeeds] URL:', url);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  console.log('[fetchUserFeeds] 응답 상태:', res.status);

  let json: any = {};
  try {
    const text = await res.text();
    console.log('[fetchUserFeeds] 응답 본문:', text);
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    console.log('[fetchUserFeeds] JSON 파싱 실패:', e);
  }

  const code = json?.code ?? res.status;
  
  // 403: 팔로워만 열람 가능
  if (code === 403) {
    throw new Error('FOLLOWERS_ONLY');
  }
  
  // 404: 유저 없음
  if (code === 404) {
    throw new Error('USER_NOT_FOUND');
  }

  // 429: 요청 제한
  if (code === 429) {
    throw new Error('RATE_LIMIT');
  }

  if (code !== 200) {
    throw new Error(json?.msg ?? json?.message ?? `HTTP ${res.status}`);
  }

  return json?.data ?? { feeds: [], nextCursor: null };
}
export async function fetchTimeline(
  p: { limit?: number; cursor?: string | null } = {}
) {
  const limit = p.limit ?? 20;
  const cursor = p.cursor ?? null;

  const url =
    `${BASE_URL}/api/feeds/timeline` +
    `?limit=${encodeURIComponent(limit)}` +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');

  const token = await getToken();
  console.log('[timeline] URL =', url);
  console.log('[timeline] hasToken =', !!token);

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  const code = json?.code ?? res.status;
  if (code === 401) throw new Error('로그인이 필요합니다(401)');
  if (code === 403) throw new Error('권한이 없어요(403)');
  if (code === 404) throw new Error('리소스를 찾지 못했어요(404)');
  if (code === 429) throw new Error('RATE_LIMIT');
  if (code !== 200) {
      // 서버 메시지가 있으면 노출
    throw new Error(json?.msg ?? json?.message ?? `알 수 없는 서버 에러 (${res.status})`);
  }
  const data = json?.data ?? {};
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(json?.data) ? json.data : [];
  const nextCursor = data?.nextCursor ?? null;

  return { items, nextCursor };
}