// src/services/song.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './baseUrl';

// 타입 정의
export type Song = {
  id: string;
  title: string;
  filepath: string;
  prompt?: string;
  lyrics?: string;
  taskId?: string;
  audioId?: string;
  sourceAudioUrl?: string;
  streamAudioUrl?: string;
  plainLyrics?: string;
  lyricsJson?: string | any;
};

export type SongResponse = {
  title?: string;
  taskId?: string;
  audioId?: string;
  audioUrl?: string;
  sourceAudioUrl?: string;
  streamAudioUrl?: string;
  sourceStreamAudioUrl?: string;
  prompt?: string;
  lyricsJson?: string;
  plainLyrics?: string;
  // 기존 필드 (다른 API용)
  id?: string;
  songId?: string;
  songTitle?: string;
  filepath?: string;
  songUrl?: string;
  url?: string;
  description?: string;
  lyrics?: string;
};

export type TimestampLyricsRequest = {
  taskId: string;
  audioId: string;
};

// 인증 헤더 가져오기
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * 타임스탬프 가사 가져오기 및 DB 저장
 * @param taskId - Task ID
 * @param audioId - Audio ID
 * @returns Promise<any>
 */
export async function getTimestampLyrics(taskId: string, audioId: string): Promise<any> {
  try {
    const headers = await getAuthHeaders();

    console.log('[getTimestampLyrics] API 호출 시작:', { taskId, audioId });

    const response = await fetch(`${BASE_URL}/api/suno/get_timestamplyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ taskId, audioId }),
    });

    console.log('[getTimestampLyrics] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getTimestampLyrics] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[getTimestampLyrics] Response data:', JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('[getTimestampLyrics] 에러:', error);
    throw error;
  }
}

/**
 * 노래 목록 가져오기 (최근 20개)
 * @returns Promise<Song[]>
 */
export async function getSongList(): Promise<Song[]> {
  try {
    const headers = await getAuthHeaders();

    console.log('[getSongList] API 호출 시작');

    const response = await fetch(`${BASE_URL}/api/suno/getSongs`, {
      method: 'GET',
      headers: {
        ...headers,
      },
    });

    console.log('[getSongList] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getSongList] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[getSongList] Response data:', JSON.stringify(result, null, 2));

    if (!result) {
      console.warn('[getSongList] 응답이 비어있습니다');
      return [];
    }

    // getSongs는 직접 배열을 반환
    if (Array.isArray(result)) {
      console.log('[getSongList] 배열 데이터:', result.length, '개');
      return result.map((song: SongResponse) => parseSong(song));
    }

    // ApiResponse 형태로 감싸져 있는 경우
    if (result.data && Array.isArray(result.data)) {
      console.log('[getSongList] result.data 배열:', result.data.length, '개');
      return result.data.map((song: SongResponse) => parseSong(song));
    }

    console.warn('[getSongList] 예상하지 못한 응답 형식');
    return [];
  } catch (error) {
    console.error('[getSongList] 에러:', error);
    throw error;
  }
}

/**
 * 노래 가사 가져오기 (기존 API)
 * @param songId - 노래 ID
 * @returns Promise<string>
 */
export async function getLyrics(songId: string): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    console.log('[getLyrics] API 호출 시작:', songId);

    const response = await fetch(`${BASE_URL}/api/song/getlyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ songId }),
    });

    console.log('[getLyrics] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getLyrics] Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[getLyrics] Response data:', JSON.stringify(result, null, 2));

    // ApiResponse<Object> 구조 처리
    if (result.data) {
      // data가 문자열인 경우
      if (typeof result.data === 'string') {
        return result.data;
      }
      // data가 객체이고 lyrics 필드가 있는 경우
      if (result.data.lyrics) {
        return result.data.lyrics;
      }
      // data가 객체이고 plainLyrics 필드가 있는 경우
      if (result.data.plainLyrics) {
        return result.data.plainLyrics;
      }
    }

    return '';
  } catch (error) {
    console.error('[getLyrics] 에러:', error);
    throw error;
  }
}

/**
 * API 응답을 Song 타입으로 변환
 * @param data - API 응답 데이터
 * @returns Song
 */
function parseSong(data: SongResponse): Song {
  return {
    // Suno API 형식 (getSongs)
    id: data.taskId || data.audioId || data.id || data.songId || '',
    title: data.title || data.songTitle || '제목 없음',
    filepath: data.audioUrl || data.streamAudioUrl || data.sourceAudioUrl ||
              data.filepath || data.songUrl || data.url || '',
    prompt: data.prompt || data.description,
    lyrics: data.plainLyrics || data.lyrics,
    taskId: data.taskId,
    audioId: data.audioId,
    sourceAudioUrl: data.sourceAudioUrl,
    streamAudioUrl: data.streamAudioUrl,
    plainLyrics: data.plainLyrics,
    lyricsJson: data.lyricsJson,
  };
}