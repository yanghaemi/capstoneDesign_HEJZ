// src/api/follow.ts (새 파일)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

async function getAuthToken(): Promise<string | null> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [, val] of pairs) if (val) return val;
  return null;
}

/** 팔로우하기 */
export async function followUser(username: string): Promise<void> {
  const token = await getAuthToken();
  console.log('[followUser] 요청:', username, 'token:', !!token);

  const res = await fetch(`${BASE_URL}/api/follow/follow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username }),
  });

  const json = await res.json();
  console.log('[followUser] 응답:', json);

  const code = json?.code ?? res.status;

  if (code !== 200) {
    throw new Error(json?.msg ?? json?.message ?? '팔로우 실패');
  }

  console.log('[followUser] 성공!');
  return json?.data ?? json;
}

/** 언팔로우하기 */
export async function unfollowUser(username: string): Promise<void> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/follow/unfollow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username }),
  });

  const json = await res.json();
  const code = json?.code ?? res.status;

  if (code !== 200) {
    throw new Error(json?.msg ?? json?.message ?? '언팔로우 실패');
  }
}

/** 맞팔 여부 확인 */
export async function checkInterFollow(username: string): Promise<boolean> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/follow/interfollow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username }),
  });

  const json = await res.json();
  const code = json?.code ?? res.status;

  if (code !== 200) {
    return false;
  }

  return json?.data === true || json?.data?.isInterFollow === true;
}

/** 팔로잉 목록 조회 */
export async function getFollowings(): Promise<any[]> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/follow/getFollowings`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json();
  const code = json?.code ?? res.status;

  if (code !== 200) {
    throw new Error(json?.msg ?? json?.message ?? '팔로잉 목록 조회 실패');
  }

  return Array.isArray(json?.data) ? json.data : [];
}

/** 팔로워 목록 조회 */
export async function getFollowers(): Promise<any[]> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/follow/getFollowers`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json();
  const code = json?.code ?? res.status;

  if (code !== 200) {
    throw new Error(json?.msg ?? json?.message ?? '팔로워 목록 조회 실패');
  }

  return Array.isArray(json?.data) ? json.data : [];
}