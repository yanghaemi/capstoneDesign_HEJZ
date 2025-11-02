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
  token: 'auth.token',
} as const;

const ME_PATH = '/api/user/myinfo';
const PUBLIC_INFO_PATH = '/api/user/info'; // 🔁 변경: POST { username }

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

/** 백엔드 payload → 공통 UserProfile 매핑 */
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

/** ApiResponse 형태도 함께 처리해서 payload 꺼내기 */
function extractPayloadAndMaybeThrow(raw: string, status: number) {
  // 기본 에러 메시지
  const defaultMsg = `HTTP ${status}`;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    // ApiResponse 형태인 경우: { code, msg, data }
    if (parsed && typeof parsed === 'object' && ('code' in parsed || 'data' in parsed)) {
      const code = typeof parsed.code === 'number' ? parsed.code : status;
      if (code !== 200) {
        const msg = parsed.msg || parsed.message || defaultMsg;
        throw new Error(msg);
      }
      return parsed.data ?? {};
    }
    // 그냥 data가 바로 오는 경우
    return parsed;
  } catch (e) {
    // JSON 파싱 실패 시, 상태코드가 에러면 raw 더미로 던짐
    if (status < 200 || status >= 300) {
      throw new Error(raw || defaultMsg);
    }
    // 2xx인데 JSON이 아니면 빈 객체
    return {};
  }
}

/** 내 프로필 가져오기 (GET /api/user/myinfo) */
export async function fetchMyProfile(): Promise<UserProfile> {
  const token = await getToken();
  const url = `${BASE_URL}${ME_PATH}`;
  console.log('[myinfo] token exists?', !!token);
  console.log('[myinfo] URL =', url);

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    // HTTP 에러
    try {
      const j = raw ? JSON.parse(raw) : null;
      console.log('[myinfo] error body =', j);
      throw new Error(j?.msg || j?.message || `HTTP ${res.status}`);
    } catch {
      console.log('[myinfo] error raw =', raw);
      throw new Error(raw || `HTTP ${res.status}`);
    }
  }

  const payload = extractPayloadAndMaybeThrow(raw, res.status);
  console.log('[myinfo] payload =', payload);

  const profile: UserProfile = mapToUserProfile(payload);

  // username 보조 채움 (JWT sub)
  if (!profile.username && token) {
    const sub = decodeJwtSub(token);
    if (sub) profile.username = sub;
  }

  if (!profile.username && !profile.nickname) {
    throw new Error('myinfo 응답에 username/nickname이 없습니다.');
  }

  return profile;
}

/** 공개 프로필: username으로 조회 (POST /api/user/info) */
export async function fetchUserPublicByUsername(username: string): Promise<UserProfile> {
  if (!username) throw new Error('username이 필요합니다.');

  const token = await getToken();
  const url = `${BASE_URL}${PUBLIC_INFO_PATH}`;
  console.log('[userByUsername] URL =', url);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json', // 🔁 POST니까 필요
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ username }),
  });

  const raw = await res.text().catch(() => '');
  if (!res.ok) {
    try {
      const j = raw ? JSON.parse(raw) : null;
      console.log('[userByUsername] error body =', j);
      throw new Error(j?.msg || j?.message || `HTTP ${res.status}`);
    } catch {
      console.log('[userByUsername] error raw =', raw);
      throw new Error(raw || `HTTP ${res.status}`);
    }
  }

  const payload = extractPayloadAndMaybeThrow(raw, res.status);
  const profile = mapToUserProfile(payload);

  // 최소 보장
  if (!profile.username) profile.username = username;
  if (!profile.nickname) profile.nickname = username;

  return profile;
}

/** 편의 함수: username 없으면 내 정보, 있으면 상대 정보 */
export async function fetchUserInfo(username?: string) {
  return username ? fetchUserPublicByUsername(username) : fetchMyProfile();
}
