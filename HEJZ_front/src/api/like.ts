import { BASE_URL } from './baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';


export async function getAuthToken(): Promise<string | null> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [, val] of pairs) if (val) return val;
  return null;
}

export async function likeFeed(feedId: number): Promise<any> { // ✅ feedId: number 추가
    const token = await getAuthToken();
    console.log('[likeFeed] 요청:', feedId, 'token:', !!token);

    const res = await fetch(`${BASE_URL}/api/feeds/like/feed`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ feedId }),
    });

    const json = await res.json();
    console.log('[likeFeed] 응답:', json);

    const code = json?.code ?? res.status;

    if (code !== 200) {
        throw new Error(json?.msg ?? json?.message ?? '좋아요 실패');
    }

    console.log('[likeFeed] 성공!');
    return json?.data ?? json;
}

export async function isLiked(feedId: number): Promise<any>{
    const token = await getAuthToken();
    console.log('[isLiked] 요청:', feedId, 'token:', !!token);

    const res = await fetch(`${BASE_URL}/api/feeds/like/isliked`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ feedId }),
    });

    const json = await res.json();
    console.log('[isLiked] 응답:', json);

    const code = json?.code ?? res.status;

    if (code !== 200) {
        throw new Error(json?.msg ?? json?.message ?? '좋아요 조회 실패');
    }

    console.log('[isLiked] 성공!');
    return json?.data ?? json;
}

export async function getListOfLike(feedId: number): Promise<any>{
    const token = await getAuthToken();
    console.log('[getListOfLike] 요청:', feedId, 'token:', !!token);

    const res = await fetch(`${BASE_URL}/api/feeds/like/get_list_of_like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ feedId }),
    });

    const json = await res.json();
    console.log('[getListOfLike] 응답:', json);

    const code = json?.code ?? res.status;

    if (code !== 200) {
        throw new Error(json?.msg ?? json?.message ?? '좋아요 조회 실패');
    }

    console.log('[getListOfLike] 성공!');
    return json?.data ?? json;
}