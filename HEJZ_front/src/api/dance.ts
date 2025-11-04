// src/api/dance.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

// 타입 정의
export type LyricsRequest = {
  lyrics: string;
  selectedEmotion: string;
  selectedGenre: string;
};

export type LyricsGroupRecommendation = {
  lyricsGroup: string;
  analyzedEmotion: string;
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

// 인증 헤더 가져오기
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 가사 분석 및 통합 안무 추천
 * @param lyrics - 가사 텍스트
 * @param selectedEmotion - 선택한 감정
 * @param selectedGenre - 선택한 장르
 * @returns Promise<IntegratedRecommendationResponse>
 */
export async function analyzeLyrics(
  lyrics: string,
  selectedEmotion: string,
  selectedGenre: string
): Promise<IntegratedRecommendationResponse> {
  try {
    const headers = await getAuthHeaders();

    console.log('[analyzeLyrics] API 호출 시작');
    console.log('[analyzeLyrics] Params:', {
      lyricsLength: lyrics.length,
      selectedEmotion,
      selectedGenre
    });

    const response = await fetch(`${BASE_URL}/api/emotion/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        lyrics,
        selectedEmotion,
        selectedGenre,
      }),
    });

    console.log('[analyzeLyrics] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[analyzeLyrics] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[analyzeLyrics] Response data:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('[analyzeLyrics] 에러:', error);
    throw error;
  }
}

/**
 * 가사 그룹별 선택 안무 저장 (Bulk)
 * @param selections - 선택한 안무 목록
 * @returns Promise<string>
 */
export async function saveEmotionSelections(
  selections: SelectionGroupDto[]
): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    console.log('[saveEmotionSelections] API 호출 시작');
    console.log('[saveEmotionSelections] Selections count:', selections.length);

    const response = await fetch(`${BASE_URL}/api/emotion/selection/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(selections),
    });

    console.log('[saveEmotionSelections] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[saveEmotionSelections] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.text();
    console.log('[saveEmotionSelections] Response:', result);

    return result;
  } catch (error) {
    console.error('[saveEmotionSelections] 에러:', error);
    throw error;
  }
}

/**
 * 저장된 안무 선택 조회
 * @returns Promise<SelectionGroupResponseDto[]>
 */
export async function getAllEmotionSelections(): Promise<SelectionGroupResponseDto[]> {
  try {
    const headers = await getAuthHeaders();

    console.log('[getAllEmotionSelections] API 호출 시작');

    const response = await fetch(`${BASE_URL}/api/emotion/selection`, {
      method: 'GET',
      headers: {
        ...headers,
      },
    });

    console.log('[getAllEmotionSelections] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getAllEmotionSelections] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[getAllEmotionSelections] Response data:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('[getAllEmotionSelections] 에러:', error);
    throw error;
  }
}

/**
 * 2줄씩 가사를 분석하는 헬퍼 함수
 * @param lyrics - 전체 가사
 * @param selectedEmotion - 선택한 감정
 * @param selectedGenre - 선택한 장르
 * @returns Promise<LyricsGroupRecommendation[]>
 */
export async function analyzeLyricsByTwoLines(
  lyrics: string,
  selectedEmotion: string,
  selectedGenre: string
): Promise<LyricsGroupRecommendation[]> {
  const response = await analyzeLyrics(lyrics, selectedEmotion, selectedGenre);
  return response.lyricsRecommendations;
}

/**
 * 모션 ID로 presigned URL 가져오기
 * @param motionId - 모션 ID
 * @returns Promise<string>
 */
export async function getMotionUrl(motionId: string): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    console.log('[getMotionUrl] API 호출:', motionId);

    const response = await fetch(`${BASE_URL}/api/motion/${encodeURIComponent(motionId)}`, {
      method: 'GET',
      headers: {
        ...headers,
      },
    });

    console.log('[getMotionUrl] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getMotionUrl] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const url = await response.text();
    console.log('[getMotionUrl] URL:', url);

    return url;
  } catch (error) {
    console.error('[getMotionUrl] 에러:', error);
    throw error;
  }
}

/**
 * 여러 모션 ID의 URL을 한번에 가져오기
 * @param motionIds - 모션 ID 배열
 * @returns Promise<Map<string, string>> - motionId -> url 매핑
 */
export async function getMotionUrls(motionIds: string[]): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  // 병렬로 URL 가져오기
  await Promise.all(
    motionIds.map(async (motionId) => {
      try {
        const url = await getMotionUrl(motionId);
        urlMap.set(motionId, url);
      } catch (error) {
        console.error(`Failed to get URL for motion ${motionId}:`, error);
        // 실패해도 계속 진행
      }
    })
  );

  return urlMap;
}