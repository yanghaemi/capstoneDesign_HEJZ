// src/api/comment.ts
import { BASE_URL } from './baseUrl';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CommentDto {
  id: number;
  comment: string;
  createdAt: string;
  userId: number;
  username: string;
  likeCount: number;
}

export interface CommentCreateRequest {
  feedId: number;
  comment: string;
}

// -----------------------------
// 내부 유틸: 토큰/응답 언래퍼
// -----------------------------
async function getAuthToken(): Promise<string | null> {
  const keys = ['auth.token', 'token', 'accessToken', 'jwt'];
  const pairs = await AsyncStorage.multiGet(keys);
  for (const [, val] of pairs) if (val) return val;
  return null;
}

function unwrapApi<T = any>(json: any): T {
  const code = json?.code ?? json?.status ?? json?.statusCode;
  if (typeof code === 'number' && code !== 200) {
    const msg = json?.message ?? json?.msg ?? '요청 실패';
    throw new Error(msg);
  }
  // code 필드가 없더라도 data가 있으면 우선 반환
  return (json?.data ?? json) as T;
}

// -----------------------------
// 댓글 생성
// POST /api/comments/create
// -----------------------------
export async function createComment(feedId: number, comment: string): Promise<CommentDto> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/comments/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ feedId, comment } satisfies CommentCreateRequest),
  });

  const json = await res.json().catch(() => ({}));
  return unwrapApi<CommentDto>(json);
}

// -----------------------------
// 내 댓글 목록
// GET /api/comments/getmycomments
// -----------------------------
export async function getMyComments(): Promise<CommentDto[]> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/comments/getmycomments`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  return unwrapApi<CommentDto[]>(json) || [];
}

// -----------------------------
// 댓글 삭제
// DELETE /api/comments/delete  (body: { commentId })
// -----------------------------
export async function deleteComment(commentId: number): Promise<void> {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}/api/comments/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ commentId }),
  });

  const json = await res.json().catch(() => ({}));
  unwrapApi(json); // 에러면 throw, 성공이면 아무것도 반환하지 않음
}

// -----------------------------
// (주의) 피드별 댓글 목록
// 제공된 컨트롤러에는 해당 엔드포인트가 없음.
// 실제 백엔드 경로 알려주면 여기에 맞춰 구현할게.
// -----------------------------
// export async function getCommentsByFeed(feedId: number): Promise<CommentDto[]> {
//   const token = await getAuthToken();
//   const res = await fetch(`${BASE_URL}/api/feeds/${feedId}/comments`, {
//     method: 'GET',
//     headers: {
//       Accept: 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//   });
//   const json = await res.json().catch(() => ({}));
//   return unwrapApi<CommentDto[]>(json) || [];
// }
