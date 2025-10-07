// src/api/follow.ts
import { apiFetch } from './fetcher';

export type FollowUser = {
  username: string;
  nickname?: string;
  profileImageUrl?: string | null;
};

export async function follow(username: string) {
  return apiFetch('/follow/follow', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function unfollow(username: string) {
  return apiFetch('/follow/unfollow', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function getFollowers(): Promise<FollowUser[]> {
  const r = await apiFetch<FollowUser[]>('/follow/getFollowers', { method: 'GET' });
  return Array.isArray(r.data) ? r.data : [];
}

export async function getFollowings(): Promise<FollowUser[]> {
  const r = await apiFetch<FollowUser[]>('/follow/getFollowings', { method: 'GET' });
  return Array.isArray(r.data) ? r.data : [];
}

export async function isInterfollow(username: string): Promise<boolean> {
  const r = await apiFetch<boolean>('/follow/interfollow', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
  return !!r.data;
}

// 단일 API가 없으니 내 팔로잉 목록으로 판별
export async function amIFollowing(username: string): Promise<boolean> {
  const list = await getFollowings();
  return list.some(u => u.username === username);
}
