// src/api/dance.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

/* =========================
 * 타입 정의
 * ========================= */
export type LyricsRequest = {
  lyrics: string;
  selectedEmotion: string;
  selectedGenre: string;
};

export type LyricsGroupRecommendation = {
  lyricsGroup: string;            // 2줄 가사 묶음
  analyzedEmotion: string;        // 분석된 감정
  selectedEmotionMotion: string | null;
  selectedGenreMotion: string | null;
  analyzedMotion1: string | null;
  analyzedMotion2: string | null;
};

export type IntegratedRecommendationResponse = {
  lyricsRecommendations: LyricsGroupRecommendation[];
};

export type SelectionGroupDto = {
  lyricsGroup: string;
  selectedMotionIds: string[];
};

export type SelectionGroupResponseDto = {
  lyricsGroup: string;
  selectedMotionIds: string[];
  videoUrls: string[];
};

/* =========================
 * 공통: 인증 헤더
 * ========================= */
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* =========================
 * 유틸: 가사 정규화
 * - [Verse], [Chorus] 같은 섹션 태그 제거
 * - 공백 라인 제거
 * ========================= */
export function normalizePlainLyrics(raw: string) {
  return (raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\[(.*?)\]\n?/g, '') // 섹션 태그 제거
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n');
}

/* =========================
 * 1) 전체 가사 분석 API
 * - 서버 DTO 변화 대비: selectedEmotion/selectedGenre + emotion/genre 모두 전송
 * ========================= */
export async function analyzeLyrics(
  lyrics: string,
  selectedEmotion: string,
  selectedGenre: string
): Promise<IntegratedRecommendationResponse> {
  const headers = await getAuthHeaders();

  const body = {
    lyrics,
    selectedEmotion,
    selectedGenre,

  };

  console.log('[analyzeLyrics] REQUEST =', JSON.stringify(body));

  const res = await fetch(`${BASE_URL}/api/emotion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log('[analyzeLyrics] STATUS =', res.status);
  console.log('[analyzeLyrics] RESPONSE =', text);

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

  const json = text ? JSON.parse(text) : {};
  return json as IntegratedRecommendationResponse;
}

/* =========================
 * 2) 2줄 단위 분석 헬퍼
 * - 항상 배열만 반환해서 화면에서 바로 setRecs([...]) 가능
 * ========================= */
export async function analyzeLyricsByTwoLines(
  lyrics: string,
  emotion: string,
  genre: string
): Promise<LyricsGroupRecommendation[]> {
  const headers = await getAuthHeaders();

  const payload = {
    lyrics,
    selectedEmotion: emotion,
    selectedGenre: genre,

  };

  console.log('[analyzeLyricsByTwoLines] REQUEST =', JSON.stringify(payload));

  const res = await fetch(`${BASE_URL}/api/emotion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('[analyzeLyricsByTwoLines] STATUS =', res.status);
  console.log('[analyzeLyricsByTwoLines] RESPONSE =', text);

  if (!res.ok) throw new Error(`HTTP ${res.status} ${text}`);

  const json = text ? JSON.parse(text) : {};
  const arr = Array.isArray(json?.lyricsRecommendations) ? json.lyricsRecommendations : [];
  return arr as LyricsGroupRecommendation[];
}

/* =========================
 * 3) 선택(블록별) Bulk 저장
 * ========================= */
export async function saveEmotionSelections(
  selections: SelectionGroupDto[]
): Promise<string> {
  const headers = await getAuthHeaders();

  console.log('[saveEmotionSelections] API 호출 시작');
  console.log('[saveEmotionSelections] Selections count:', selections.length);

  const res = await fetch(`${BASE_URL}/api/emotion/selection/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(selections),
  });

  const text = await res.text();
  console.log('[saveEmotionSelections] STATUS =', res.status);
  console.log('[saveEmotionSelections] RESPONSE =', text);

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text;
}

/* =========================
 * 4) 저장된 선택 조회
 * ========================= */
export async function getAllEmotionSelections(): Promise<SelectionGroupResponseDto[]> {
  const headers = await getAuthHeaders();

  console.log('[getAllEmotionSelections] API 호출 시작');

  const res = await fetch(`${BASE_URL}/api/emotion/selection`, {
    method: 'GET',
    headers: { ...headers },
  });

  const text = await res.text();
  console.log('[getAllEmotionSelections] STATUS =', res.status);
  console.log('[getAllEmotionSelections] RESPONSE =', text);

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

  const json = text ? JSON.parse(text) : [];
  return json as SelectionGroupResponseDto[];
}

/* =========================
 * 5) 모션 URL (presigned)
 * ========================= */
export async function getMotionUrl(motionId: string): Promise<string> {
  const headers = await getAuthHeaders();

  console.log('[getMotionUrl] motionId =', motionId);

  const res = await fetch(`${BASE_URL}/api/motion/${encodeURIComponent(motionId)}`, {
    method: 'GET',
    headers: { ...headers },
  });

  const text = await res.text();
  console.log('[getMotionUrl] STATUS =', res.status);
  console.log('[getMotionUrl] RESPONSE =', text);

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text; // URL 문자열
}

/* =========================
 * 6) 여러 모션 URL 병렬 조회
 * ========================= */
export async function getMotionUrls(motionIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    motionIds.map(async (mid) => {
      try {
        const url = await getMotionUrl(mid);
        map.set(mid, url);
      } catch (e) {
        console.error(`[getMotionUrls] fail: ${mid}`, e);
      }
    })
  );
  return map;
}
