// src/screens/Dance/DanceRecommendScreen.tsx
// DB lyrics_json 기반: \n을 2번 만나면 한 블록으로 처리
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import RNSoundPlayer from 'react-native-sound-player';

import {
  analyzeLyricsByTwoLines,
  getMotionUrl,
  saveEmotionSelections,
  type LyricsGroupRecommendation,
  type SelectionGroupDto,
} from '../../api/dance';

// ====== 타입 ======
type LWord = { word: string; startS: number; endS: number };
type TimingBlock = { start: number; end: number };

type Props = {
  route: {
    params: {
      p_id: string;
      p_title: string;
      p_filepath: string;
      p_emotion: string;
      p_genre: string;
      p_plainLyrics?: string;
      p_lyricsJsonRaw?: string;
    };
  };
  navigation: any;
};

// ====== 유틸 ======
function buildTimingBlocksFromLyricsJson(words: LWord[]): TimingBlock[] {
  const blocks: TimingBlock[] = [];
  if (!Array.isArray(words) || words.length === 0) return blocks;

  let blockStart: number | null = null;
  let newlineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (blockStart == null) blockStart = w.startS;

    const numNewlines = (w.word.match(/\n/g) || []).length;
    newlineCount += numNewlines;

    if (newlineCount >= 2) {
      blocks.push({ start: blockStart, end: w.endS });
      blockStart = null;
      newlineCount = 0;
    }
  }

  if (blockStart != null && words.length > 0) {
    const lastEnd = words[words.length - 1]?.endS ?? blockStart;
    blocks.push({ start: blockStart, end: lastEnd });
  }

  console.log(`📊 타이밍 블록 ${blocks.length}개 생성:`, blocks);
  return blocks;
}

// 후보 4개 추출(중복 제거)
function extractCandidates(r: LyricsGroupRecommendation): string[] {
  const list = [
    r.selectedEmotionMotion,
    r.selectedGenreMotion,
    r.analyzedMotion1,
    r.analyzedMotion2,
  ].filter(Boolean) as string[];
  return Array.from(new Set(list)).slice(0, 4);
}

// 가사/타이밍 소스 확보
function fromPassedParams(plain?: string, jsonRaw?: string) {
  // \\n → 실제 줄바꿈
  let plainLyrics = (plain ?? '').replace(/\\n/g, '\n');
  // [Verse], [Chorus] 제거
  plainLyrics = plainLyrics.replace(/\[.*?\]\n?/g, '');
  console.log('📝 처리된 가사:\n', plainLyrics);

  let arr: any[] = [];
  try { arr = jsonRaw ? JSON.parse(jsonRaw) : []; } catch { arr = []; }

  const lyricsWords = (arr || []).map((x: any) => ({
    word: String(x?.word ?? '').replace(/\\n/g, '\n'),
    startS: Number(x?.startS ?? 0),
    endS: Number(x?.endS ?? 0),
  }));

  return { plainLyrics, lyricsWords };
}

export default function DanceRecommendScreen({ route, navigation }: Props) {
  const { p_title, p_filepath } = route.params;

  // 전체 상태
  const [loading, setLoading] = useState(true);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);

  // 분석 & 타이밍
  const [recs, setRecs] = useState<LyricsGroupRecommendation[]>([]);
  const [timing, setTiming] = useState<TimingBlock[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 후보 포인터(블록마다 현재 후보 idx)
  const [ptrByBlock, setPtrByBlock] = useState<number[]>([]);

  // 표시용 URL 캐시(선택된 후보에 대한 디버깅/표시)
  const [motionUrlsMap, setMotionUrlsMap] = useState<Map<string, string>>(new Map());
  const [loadingMotions, setLoadingMotions] = useState(false);

  // ▶️ 실제 Video가 사용하는 전용 상태 (여기에 응답 URL을 "그대로" 저장)
  const [playerMotionId, setPlayerMotionId] = useState<string | null>(null);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  // 오디오 루프 상태
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 선택 누적(블록별 1개씩)
  const [selections, setSelections] = useState<SelectionGroupDto[]>([]);

  const isFinished = useMemo(() => currentIndex >= recs.length, [currentIndex, recs.length]);

  // ========== 1) 초기: 분석 + 타이밍 ==========
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { p_emotion, p_genre, p_plainLyrics, p_lyricsJsonRaw } = route.params;

        const { plainLyrics, lyricsWords } = fromPassedParams(p_plainLyrics, p_lyricsJsonRaw);
        if (!plainLyrics?.trim()) throw new Error('plain_lyrics가 없습니다.');
        if (!lyricsWords.length)   throw new Error('lyrics_json(타이밍)이 없습니다.');

        const analysis = await analyzeLyricsByTwoLines(plainLyrics, p_emotion, p_genre);
        const timingBlocks = buildTimingBlocksFromLyricsJson(lyricsWords);

        const n = Math.min(analysis.length, timingBlocks.length);
        setRecs(analysis.slice(0, n));
        setTiming(timingBlocks.slice(0, n));
        setPtrByBlock(new Array(n).fill(0));

        console.log(`✅ 분석 완료: ${n}개 블록`);

        if (n > 0) {
          setCurrentIndex(0);
          setLoopStart(timingBlocks[0].start);
          setLoopEnd(timingBlocks[0].end);
          try { RNSoundPlayer.seek(timingBlocks[0].start + 0.01); } catch {}
          setCurrentTime(timingBlocks[0].start);
        }
      } catch (e: any) {
        console.error('초기 로드 실패:', e);
        setAnalyzeErr(e?.message ?? '초기 로드 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [route.params]);

  // ========== 2) 후보 바뀔 때 응답 URL 로드 → playerUrl에 그대로 세팅 ==========
  useEffect(() => {
    if (loading || isFinished) return;

    const rec = recs[currentIndex];
    if (!rec) return;

    const cands = extractCandidates(rec);
    const ptr = ptrByBlock[currentIndex] ?? 0;
    const motionId = cands[ptr];
    if (!motionId) return;

    (async () => {
      try {
        setLoadingMotions(true);
        console.log(`[블록 ${currentIndex}, 후보 ${ptr + 1}/${cands.length}] URL 로드:`, motionId);

        const raw = await getMotionUrl(motionId);
        // 응답 문자열의 앞뒤 따옴표/개행 제거만, 그 외 인코딩/가공 절대 금지
        const url = raw.trim().replace(/^"|"$/g, '');

        console.log('🔗 URL 로드 완료 (playerUrl에 그대로 저장):', url.substring(0, 140) + '...');
        setMotionUrlsMap(new Map([[motionId, url]]));

        setPlayerMotionId(motionId);
        setPlayerUrl(url); // ★ Video는 이 값만 사용
      } catch (e) {
        console.error('❌ URL 로드 실패:', e);
        setMotionUrlsMap(new Map());
        setPlayerMotionId(null);
        setPlayerUrl(null);
      } finally {
        setLoadingMotions(false);
      }
    })();
  }, [currentIndex, ptrByBlock, recs, loading, isFinished]);

  // ========== 3) 블록 바뀌면 루프 갱신 ==========
  useEffect(() => {
    if (isFinished) { setLoopStart(null); setLoopEnd(null); return; }
    const blk = timing[currentIndex];
    if (blk) {
      console.log(`⏰ 블록 ${currentIndex} 타이밍:`, blk.start, '~', blk.end);
      setLoopStart(blk.start);
      setLoopEnd(blk.end);
      try { RNSoundPlayer.seek(blk.start + 0.01); } catch {}
      setCurrentTime(blk.start);
    }
  }, [currentIndex, timing, isFinished]);

  // ========== 4) 오디오 재생 컨트롤(루프) ==========
  const audioUrl = p_filepath;
  const handlePlay = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioUrl?.startsWith('http') || audioUrl?.startsWith('file')) {
        await RNSoundPlayer.playUrl(audioUrl);
      } else {
        Alert.alert('재생 오류', '유효한 오디오 URL이 아닙니다.');
        return;
      }
      if (loopStart != null) {
        setTimeout(() => { try { RNSoundPlayer.seek(loopStart + 0.01); } catch {} }, 250);
      }
      const id = setInterval(async () => {
        try {
          const info = await RNSoundPlayer.getInfo();
          const now = info.currentTime || 0;
          setCurrentTime(now);
          setDuration(info.duration || 0);
          if (loopStart != null && loopEnd != null) {
            const EPS = 0.05;
            if (now + EPS >= loopEnd) {
              try { RNSoundPlayer.seek(loopStart + 0.01); } catch {}
              setCurrentTime(loopStart);
            }
          }
        } catch {}
      }, 150);
      intervalRef.current = id;
    } catch {
      Alert.alert('재생 실패', '오디오를 재생할 수 없어요.');
    }
  };
  const handleStop = () => {
    try { RNSoundPlayer.stop(); } catch {}
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const handleSeek = (value: number) => {
    let v = value;
    if (loopStart != null && loopEnd != null) {
      if (v < loopStart) v = loopStart;
      if (v > loopEnd - 0.05) v = loopEnd - 0.05;
    }
    try { RNSoundPlayer.seek(v); } catch {}
    setCurrentTime(v);
  };
  useEffect(() => {
    return () => {
      try { RNSoundPlayer.stop(); } catch {}
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ========== 5) 후보 변경/선택 ==========
  const cycleCandidate = () => {
    const rec = recs[currentIndex];
    if (!rec) return;
    const total = extractCandidates(rec).length;
    if (total <= 1) return;
    setPtrByBlock(prev => {
      const next = [...prev];
      next[currentIndex] = ((prev[currentIndex] ?? 0) + 1) % total;
      return next;
    });
  };

  const selectCurrent = () => {
    if (isFinished) return;
    const rec = recs[currentIndex];
    const cands = extractCandidates(rec);
    const ptr = ptrByBlock[currentIndex] ?? 0;
    const motionId = cands[ptr];
    if (!motionId) {
      Alert.alert('알림', '선택할 후보가 없어요.');
      return;
    }

    const lyricsGroup = rec.lyricsGroup || '';
    setSelections(prev => {
      const list = [...prev];
      const idx = list.findIndex(x => x.lyricsGroup === lyricsGroup);
      if (idx >= 0) list[idx] = { lyricsGroup, selectedMotionIds: [motionId] };
      else list.push({ lyricsGroup, selectedMotionIds: [motionId] });
      return list;
    });

    console.log(`✔ 블록 ${currentIndex} 선택:`, motionId);
    setCurrentIndex(i => i + 1);
  };

  // ========== 6) 마지막에 bulk 저장 ==========
  useEffect(() => {
    (async () => {
      if (!isFinished || selections.length === 0) return;
      try {
        console.log('💾 저장 시작:', selections);
        const msg = await saveEmotionSelections(selections);
        Alert.alert('완료', msg || '선택한 안무가 저장되었습니다.');
      } catch (e: any) {
        console.error('저장 실패:', e);
        Alert.alert('오류', e?.message ?? '저장 중 오류가 발생했어요.');
      }
    })();
  }, [isFinished, selections]);

  // ========== 렌더 ==========
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ color: '#fff', marginTop: 12 }}>블록별 추천 분석 중…</Text>
      </View>
    );
  }
  if (analyzeErr) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#fff' }}>{analyzeErr}</Text>
      </View>
    );
  }

  const blkCnt = recs.length;
  const rec = recs[currentIndex];
  const lyricsLines = (rec?.lyricsGroup || '').split('\n').slice(0, 2);
  const cands = rec ? extractCandidates(rec) : [];
  const ptr = ptrByBlock[currentIndex] ?? 0;

  // 표시용(디버깅)
  const currentMotionId = cands[ptr];
  const currentMotionUrl = currentMotionId ? motionUrlsMap.get(currentMotionId) : null;

  console.log('=== 렌더 디버깅 ===');
  console.log('currentIndex:', currentIndex);
  console.log('후보 목록:', cands);
  console.log('현재 포인터:', ptr);
  console.log('표시용 motionId:', currentMotionId);
  console.log('표시용 URL(map):', currentMotionUrl);
  console.log('▶ playerMotionId:', playerMotionId);
  console.log('▶ playerUrl:', playerUrl);

  return (
    <ImageBackground
      source={require('../../assets/background/DanceRecommendBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.motionCard}>
        <Text style={styles.motionTitle}>
          {isFinished ? '모든 선택 완료' : `가사 블록 ${currentIndex + 1}/${blkCnt}`}
        </Text>

        {!isFinished ? (
          <>
            <View style={styles.lyricsBox}>
              <Text style={styles.lyricLine}>{lyricsLines[0] || ''}</Text>
              <Text style={styles.lyricLine}>{lyricsLines[1] || ''}</Text>
            </View>

            <Text style={styles.candidateBadgeText}>
              {cands.length ? `후보 ${ptr + 1}/${cands.length}` : '후보 없음'}
            </Text>

            {loadingMotions ? (
              <View style={[styles.video, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 8, color: '#666' }}>후보 영상 로딩 중...</Text>
              </View>
            ) : playerUrl ? (
              <View style={{ alignItems: 'center' }}>
                {console.log('🎬 Video 렌더링(playerUrl):', playerUrl.substring(0, 120))}
                <Video
                  key={playerUrl}                       // 소스 변경 시 재마운트
                  source={{ uri: playerUrl, type: 'mp4' }} // ★ 응답 URL 그대로 사용
                  style={styles.video}
                  resizeMode="cover"
                  repeat
                  paused={false}
                  muted={false}
                  onError={(e) => {
                    console.error('❌ Video Error with URL =', playerUrl, e);
                  }}
                  onLoad={(data) => {
                    console.log('✅ Video Loaded from =', playerUrl, data?.naturalSize);
                  }}
                />
                <View style={{ padding: 8, backgroundColor: '#1c1c1e', borderRadius: 8, marginTop: 4, width: '90%' }}>
                  <Text style={{ fontSize: 10, color: '#fff' }}>
                    🎬 motionId: {playerMotionId || '(없음)'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#87cefa', marginTop: 2 }} numberOfLines={1}>
                    🔗 {playerUrl}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.video, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#999', fontSize: 16, fontWeight: 'bold' }}>영상 없음</Text>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                  {cands.length > 0 ? 'URL을 가져올 수 없습니다' : '추천된 후보가 없습니다'}
                </Text>
              </View>
            )}

            <View style={styles.controls}>
              <TouchableOpacity
                onPress={cycleCandidate}
                style={[styles.controlButton, styles.resetButton]}
                disabled={cands.length <= 1 || loadingMotions}
              >
                <Text style={styles.controlText}>⏭ 후보 변경</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectCurrent}
                style={[styles.controlButton, styles.playButton]}
                disabled={loadingMotions || !playerUrl}
              >
                <Text style={styles.controlText}>✔ 선택</Text>
              </TouchableOpacity>

              {playerUrl && (
                <TouchableOpacity
                  onPress={() => {
                    console.log('🔗 URL (player):', playerUrl);
                    Alert.alert('URL', playerUrl, [{ text: '확인' }]);
                  }}
                  style={[styles.controlButton, { backgroundColor: '#FF9800', paddingHorizontal: 8 }]}
                >
                  <Text style={styles.controlText}>🔗</Text>
                </TouchableOpacity>
              )}
            </View>

            {cands.length === 0 && (
              <TouchableOpacity
                onPress={() => setCurrentIndex(i => i + 1)}
                style={[styles.controlButton, styles.resetButton, { alignSelf: 'center' }]}
              >
                <Text style={styles.controlText}>다음 블록으로</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('RecordScreen')} style={[styles.controlButton, styles.playButton]}>
            <Text style={styles.controlText}>녹화하러 가기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 플레이어 */}
      <View style={styles.playerCard}>
        <Text style={styles.nowPlayingText}>⏱ 재생 중: {p_title}</Text>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleStop} style={[styles.controlButton, styles.stopButton]}>
            <Text style={styles.controlText}>⏸️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlay} style={[styles.controlButton, styles.playButton]}>
            <Text style={styles.controlText}>▶️</Text>
          </TouchableOpacity>
        </View>

        <Slider
          value={currentTime}
          minimumValue={0}
          maximumValue={Math.max(duration, 0)}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#4B9DFE"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#4B9DFE"
          style={styles.slider}
        />
        <Text style={styles.timeText}>
          {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} /
          {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')} 초
        </Text>
      </View>
    </ImageBackground>
  );
}

// ====== 스타일 ======
const styles = StyleSheet.create({
  background: { flex: 1 },
  motionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  motionTitle: { fontSize: 18, fontWeight: '800', color: '#111' },

  lyricsBox: { marginTop: 8, marginBottom: 6 },
  lyricLine: { fontSize: 16, color: '#333', textAlign: 'center', marginVertical: 2 },

  candidateBadgeText: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#111827',
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },

  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#222',
    borderRadius: 12,
  },

  playerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    marginVertical: 10,
    marginHorizontal: 16,
    alignItems: 'center',
  },

  controls: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  playButton: { backgroundColor: '#4B9DFE' },
  resetButton: { backgroundColor: '#81C147' },
  stopButton: { backgroundColor: '#FE4B4B' },
  controlText: { color: '#fff', fontWeight: 'bold' },

  slider: { width: '100%', height: 40, marginBottom: 6 },
  timeText: { fontSize: 13, color: '#666' },
  nowPlayingText: { fontSize: 16, fontWeight: '700', color: '#333' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});
