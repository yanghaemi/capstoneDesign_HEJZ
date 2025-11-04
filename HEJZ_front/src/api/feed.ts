// src/api/feed.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';
import { request } from './request';
import type { FeedListResponse, FeedCreateRequest, FeedItemDto } from './types/feed';
import { getToken } from '../auth/token';

// ========== 공통 ==========

function safeJson<T = any>(text: string | null): T | {} {
  try {
    return text ? (JSON.parse(text) as T) : {};
  } catch {
    return {};
  }
}

// 아이템 정규화: id 보정 + 이미지/미디어 통일 + _key 생성
function normalizeFeedItem(raw: any, idx: number) {
  const id =
    raw?.id ??
    raw?.feedId ??
    raw?.postId ??
    `${raw?.userId ?? 'u'}-${raw?.createdAt ?? 't'}-${idx}`;

  const userId =
    typeof raw?.userId === 'number'
      ? raw.userId
      : Number(raw?.userId) || undefined;

  // 백엔드가 images[] 또는 media[] 둘 중 하나 줄 수 있음
  const imagesArr = Array.isArray(raw?.images)
    ? raw.images
    : Array.isArray(raw?.media)
    ? raw.media
    : [];

  const images = imagesArr
    .map((m: any) => ({
      url: m?.url ?? m?.path ?? m?.src ?? null,
      ord: Number.isFinite(m?.ord) ? m.ord : 0,
    }))
    .filter((m: any) => !!m.url);

  const createdAt = raw?.createdAt ?? raw?.created_at ?? null;

  // 고유 키 (FlatList에 그대로 써도 됨)
  const _key = String(id);

  return {
    ...raw,
    id,
    userId,
    images,
    createdAt,
    _key,
  } as FeedItemDto & { _key: string };
}

// ApiResponse 래퍼 파서
function parseApiResponse(json: any, resStatus: number) {
  const code = json?.code ?? resStatus;
  if (code === 401) throw new Error('로그인이 필요합니다(401)');
  if (code === 403) throw new Error('권한이 없어요(403)');
  if (code === 404) throw new Error('리소스를 찾지 못했어요(404)');
  if (code === 429) throw new Error('RATE_LIMIT');
  if (code !== 200) {
    throw new Error(json?.msg ?? json?.message ?? `알 수 없는 서버 에러 (${resStatus})`);
  }
  return json?.data ?? {};
}

// items/feeds 어느 쪽이든 흡수
function pickItems(data: any): any[] {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.feeds)) return data.feeds;
  if (Array.isArray(data)) return data;
  return [];
}

// ========== 기존 API 그대로 유지 ==========
export const fetchMyFeeds = (p: { limit?: number; cursor?: string | null }) =>
  request<FeedListResponse>('/api/feeds/me', {
    params: { limit: p.limit ?? 20, cursor: p.cursor ?? undefined },
  });

export const createFeed = (body: FeedCreateRequest) =>
  request<FeedItemDto>('/api/feeds', { method: 'POST', body });

export const deleteFeed = (feedId: number) =>
  request<null>(`/api/feeds/${feedId}`, { method: 'DELETE' });

// 타인 피드 조회 (그대로 둠)
export async function fetchUserFeeds(username: string, limit: number = 20, cursor?: string): Promise<FeedListResponse> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  const token = pairs.find(([, v]) => !!v)?.[1] ?? null;

  const queryParams = new URLSearchParams({
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });

  const url = `${BASE_URL}/api/feeds/user/${encodeURIComponent(username)}?${queryParams}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = safeJson(await res.text());
  const data = parseApiResponse(json, res.status);
  const items = pickItems(data).map(normalizeFeedItem);
  const nextCursor = data?.nextCursor ?? null;
  return { feeds: items as any, nextCursor } as any;
}

// ========== ⬇️ 수정/추가 포인트: 타임라인 & 글로벌 ==========

export async function fetchTimeline(p: { limit?: number; cursor?: string | null } = {}) {
  const limit = p.limit ?? 20;
  const cursor = p.cursor ?? null;

  const url =
    `${BASE_URL}/api/feeds/timeline` +
    `?limit=${encodeURIComponent(limit)}` +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');

  const token = await getToken();

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  const data = parseApiResponse(json, res.status);

  const rawItems = pickItems(data);
  const items = rawItems.map(normalizeFeedItem);
  const nextCursor = data?.nextCursor ?? null;

  return { items, nextCursor };
}

// 전역 최신 피드(백엔드 /api/feeds/global)
export async function fetchGlobal(p: { limit?: number; cursor?: string | null } = {}) {
  const limit = p.limit ?? 20;
  const cursor = p.cursor ?? null;

  const url =
    `${BASE_URL}/api/feeds/global` +
    `?limit=${encodeURIComponent(limit)}` +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');

  const token = await getToken();

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  const data = parseApiResponse(json, res.status);

  const rawItems = pickItems(data);
  const items = rawItems.map(normalizeFeedItem);
  const nextCursor = data?.nextCursor ?? null;

  return { items, nextCursor };
}
