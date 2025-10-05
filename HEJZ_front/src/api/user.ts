// src/api/user.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

export type UserProfile = {
  id?: number;
  username: string;
  nickname: string;
  email?: string | null;
  bio?: string | null;
  avatarUrl?: string | null; // 서버에서 상대경로면 화면에서 BASE_URL과 합쳐 씀
  followers?: number;
  following?: number;
};

// ===== 로컬 캐시 키 =====
export const SK = {
  username: 'user.username',
  nickname: 'user.nickname',
  bio: 'user.bio',
  avatarUrl: 'user.avatarUrl',
  followers: 'user.followers',
  following: 'user.following',
  token: 'auth.token', // 프로젝트에 맞게 바꿔도 OK
} as const;

// 서버의 me 엔드포인트 경로(프로젝트에 맞게 '/users/me' 등으로 바꿔도 됨)
const ME_PATH = '/me';

// 토큰을 여러 키에서 시도해서 읽어옴(프로젝트마다 키가 달라서)
async function getToken() {
  const keys = [SK.token, 'accessToken', 'token', 'auth.accessToken'];
  for (const k of keys) {
    const v = await AsyncStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

function authHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** /me에서 내 프로필 가져오기 */
export async function fetchMyProfile(): Promise<UserProfile> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${ME_PATH}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(t || `GET ${ME_PATH} ${res.status}`);
  }

  const j = await res.json();

  // 서버 필드명을 화면에서 쓰는 표준형으로 매핑
  const profile: UserProfile = {
    id: j.id,
    username: j.username ?? j.userName ?? '',
    nickname: j.nickname ?? j.nickName ?? '',
    email: j.email ?? null,
    bio: j.bio ?? j.intro ?? '',
    avatarUrl: j.avatarUrl ?? j.profileImageUrl ?? j.profileUrl ?? null,
    followers: j.followers ?? j.fans ?? 0,
    following: j.following ?? j.follows ?? 0,
  };

  return profile;
}

/** 프로필 로컬 캐시 저장 */
export async function cacheMyProfile(p: Partial<UserProfile>) {
  const kv: [string, string][] = [];
  if (p.username != null)  kv.push([SK.username, String(p.username)]);
  if (p.nickname != null)  kv.push([SK.nickname, String(p.nickname)]);
  if (p.bio != null)       kv.push([SK.bio, String(p.bio)]);
  if (p.avatarUrl != null) kv.push([SK.avatarUrl, String(p.avatarUrl)]);
  if (p.followers != null) kv.push([SK.followers, String(p.followers)]);
  if (p.following != null) kv.push([SK.following, String(p.following)]);
  if (kv.length) await AsyncStorage.multiSet(kv);
}

/** 로컬 캐시에서 읽기 (네트워크 실패시 폴백) */
export async function readMyProfileCache(): Promise<UserProfile | null> {
  const arr = await AsyncStorage.multiGet([
    SK.username, SK.nickname, SK.bio, SK.avatarUrl, SK.followers, SK.following,
  ]);
  const m = Object.fromEntries(arr);
  if (!m[SK.username] && !m[SK.nickname]) return null;
  return {
    username: m[SK.username] || 'username',
    nickname: m[SK.nickname] || 'nickname',
    bio: m[SK.bio] ?? '',
    avatarUrl: m[SK.avatarUrl] || null,
    followers: Number(m[SK.followers] ?? 0),
    following: Number(m[SK.following] ?? 0),
  };
}

export default {
  fetchMyProfile,
  cacheMyProfile,
  readMyProfileCache,
  SK,
};
