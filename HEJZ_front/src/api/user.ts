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
const PUBLIC_BY_USERNAME_PATH = '/api/user/getMyInfo'; // ?username=...

/** JWT에서 sub 클레임 추출 (실패해도 조용히 무시) */
function decodeJwtSub(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const [, payloadB64] = token.split('.');
    const json = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    return typeof json?.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
}

/** 백엔드 응답(payload)을 공통 UserProfile로 매핑 */
function mapToUserProfile(payload: any): UserProfile {
  return {
    id: payload?.id ?? payload?.userId ?? undefined,
    username: payload?.username ?? payload?.userName ?? '',
    nickname: payload?.nickname ?? payload?.nickName ?? '',
    email: payload?.email ?? null,
    bio: payload?.bio ?? payload?.intro ?? '',
    avatarUrl:
      payload?.profileImageUrl ?? payload?.avatarUrl ?? payload?.profileUrl ?? null,
    followers: payload?.followers ?? payload?.fans ?? 0,
    following: payload?.following ?? payload?.follows ?? 0,
  };
}

/** 내 프로필 가져오기 (/api/user/myinfo) */
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

  const profile: UserProfile = mapToUserProfile(payload);

  // username 보조 채움 (JWT sub)
  if (!profile.username && token) {
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

/** 공개 프로필: username으로 조회 (/api/user/getMyInfo?username=...) */
export async function fetchUserPublicByUsername(username: string): Promise<UserProfile> {
  if (!username) throw new Error('username이 필요합니다.');

  const token = await getToken(); // 필요 시 인증 포함
  const url = `${BASE_URL}${PUBLIC_BY_USERNAME_PATH}?username=${encodeURIComponent(username)}`;
  console.log('[userByUsername] URL =', url);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = raw ? JSON.parse(raw) : null;
      msg = j?.message || raw || msg;
      console.log('[userByUsername] error body =', j);
    } catch {
      console.log('[userByUsername] error raw =', raw);
    }
    throw new Error(msg);
  }

  let payload: any = {};
  try {
    const j = raw ? JSON.parse(raw) : {};
    payload = (j && typeof j === 'object' && 'data' in j) ? j.data : j;
  } catch {}

  const profile = mapToUserProfile(payload);

  // 최소 보장
  if (!profile.username) profile.username = username;
  if (!profile.nickname) profile.nickname = username;

  return profile;
}
