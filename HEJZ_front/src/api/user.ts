// src/api/user.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';
import { getToken } from '../auth/token';

export type UserProfile = {
  id?: number;
  username: string;
  nickname: string;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  followers?: number;
  following?: number;
};

export const SK = {
  username: 'user.username',
  nickname: 'user.nickname',
  bio: 'user.bio',
  avatarUrl: 'user.avatarUrl',
  followers: 'user.followers',
  following: 'user.following',
  token: 'auth.token', // 로그인 시 saveToken()이 저장한 키와 일치해야 함
} as const;
const ME_PATH = '/api/user/myinfo';

export async function fetchMyProfile(): Promise<UserProfile> {
  const token = await getToken();
  console.log('[myinfo] token exists?', !!token);
  console.log('[myinfo] URL =', `${BASE_URL}${ME_PATH}`);

  const res = await fetch(`${BASE_URL}${ME_PATH}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    // 스프링 ApiResponse {code,message,data} 형태를 친절히 파싱
    let msg = `HTTP ${res.status}`;
    try {
      const j = raw ? JSON.parse(raw) : null;
      msg = j?.message || raw || msg;
      console.log('[myinfo] error body =', j);
    } catch {
      console.log('[myinfo] error raw =', raw);
    }
    throw new Error(msg);
  }

  let payload: any = {};
  try {
    const j = raw ? JSON.parse(raw) : {};
    payload = (j && typeof j === 'object' && 'data' in j) ? j.data : j;
    console.log('[myinfo] payload =', payload);
  } catch (e) {
    console.log('[myinfo] parse error:', e);
  }

  const profile: UserProfile = {
    id: payload.id ?? payload.userId ?? undefined,
    username: payload.username ?? payload.userName ?? '',
    nickname: payload.nickname ?? payload.nickName ?? '',
    email: payload.email ?? null,
    bio: payload.bio ?? payload.intro ?? '',
    avatarUrl: payload.profileImageUrl ?? payload.avatarUrl ?? payload.profileUrl ?? null,
    followers: payload.followers ?? payload.fans ?? 0,
    following: payload.following ?? payload.follows ?? 0,
  };

  if (!profile.username && token) {
    // JWT sub 보조 채움
    try {
      const sub = decodeJwtSub(token);
      if (sub) profile.username = sub;
    } catch {}
  }

  if (!profile.username && !profile.nickname) {
    throw new Error('myinfo 응답에 username/nickname이 없습니다.');
  }

  return profile;
}
