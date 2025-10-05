import { request } from './request';
import type { FeedListResponse, FeedCreateRequest, FeedItemDto } from './types/feed';

export const fetchMyFeeds = (p:{limit?:number; cursor?:string|null}) =>
  request<FeedListResponse>('/api/feeds/me', { params: { limit:p.limit ?? 20, cursor:p.cursor ?? undefined } });

export const createFeed = (body: FeedCreateRequest) =>
  request<FeedItemDto>('/api/feeds', { method:'POST', body });

export const deleteFeed = (feedId: number) =>
  request<null>(`/api/feeds/${feedId}`, { method:'DELETE' });
