// DB lyrics_json 기반: \n을 2번 만나면 한 블록으로 처리 (+ 폴백 분할)
// 첫 진입 시 1) 첫 블록 "response의 lyrics" 2줄 노출 2) 해당 구간 오디오 자동 반복
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import RNSoundPlayer from 'react-native-sound-player';

import {
  analyzeLyricsByTwoLines,
  getMotionUrl,
  saveEmotionSelections,
  type SelectionGroupDto,
  type LyricsGroupRecommendation,
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

// ====== 아이콘 ======
const ICON_RESET = require('../../assets/icon/reset.png');
const ICON_CHECK = require('../../assets/icon/check.png');
const ICON_PAUSE = require('../../assets/icon/Pause.png');
const ICON_PLAY  = require('../../assets/icon/Play.png');

// ====== 유틸 ======
function sanitizePlainLyrics(src?: string) {
  let s = (src ?? '').replace(/\\n/g, '\n');
  s = s.replace(/\r/g, '');
  s = s.replace(/\[.*?\]\n?/g, '');
  return s.trim();
}

function parseAlignedWords(jsonRaw?: string): LWord[] {
  try {
    const arr = jsonRaw ? JSON.parse(jsonRaw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.map((x: any) => ({
      word: String(x?.word ?? '').replace(/\\n/g, '\n'),
      startS: Number(x?.startS ?? 0),
      endS: Number(x?.endS ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * 개선된 타이밍 블록 생성기
 * - [Verse] 같은 태그는 제외하고 순수 가사 줄바꿈만 카운트
 * - 마지막이 \n인 단어가 2번 나오면 그 구간을 블록으로 처리
 */
function buildTimingBlocks(words: LWord[], desiredCount: number): TimingBlock[] {
  const blocks: TimingBlock[] = [];
  if (!Array.isArray(words) || words.length === 0 || desiredCount <= 0) return blocks;

  let blockStart: number | null = null;
  let lastEnd: number | null = null;
  let lineBreaks = 0;
  let cutBlocks: TimingBlock[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const txt = w.word ?? '';

    // [Verse], [Chorus] 등 태그는 건너뛰기
    if (/^\[.*\]$/.test(txt.trim())) {
      continue;
    }

    const pure = txt.replace(/\n/g, '');
    if (pure.length > 0) {
      if (blockStart == null) blockStart = w.startS;
      lastEnd = w.endS;
    }

    // 단어 끝에 \n이 있는지 확인 (마지막 문자가 \n)
    if (txt.endsWith('\n')) {
      lineBreaks++;

      // 2번의 줄바꿈을 만나면 블록 완성
      if (lineBreaks >= 2 && blockStart != null && lastEnd != null) {
        cutBlocks.push({ start: blockStart, end: lastEnd });
        blockStart = null;
        lastEnd = null;
        lineBreaks = 0;
      }
    }
  }

  // 마지막 블록 처리
  if (blockStart != null && lastEnd != null) {
    cutBlocks.push({ start: blockStart, end: lastEnd });
  }

  if (cutBlocks.length >= desiredCount) {
    return cutBlocks.slice(0, desiredCount);
  }

  // 폴백: 균등 분할
  const totalEnd = words[words.length - 1].endS || 0;
  if (totalEnd <= 0) return [{ start: 0, end: 0 }];

  const remain = desiredCount - cutBlocks.length;
  const startAt = cutBlocks.length > 0 ? cutBlocks[cutBlocks.length - 1].end : 0;
  const remainDur = Math.max(0, totalEnd - startAt);
  const step = remainDur / remain;

  const fallbackBlocks: TimingBlock[] = [];
  for (let i = 0; i < remain; i++) {
    const s = startAt + step * i;
    const e = i === remain - 1 ? totalEnd : startAt + step * (i + 1);
    if (e - s > 0.05) fallbackBlocks.push({ start: s, end: e });
  }

  const merged = [...cutBlocks, ...fallbackBlocks].slice(0, desiredCount);
  for (let i = 1; i < merged.length; i++) {
    if (merged[i].start < merged[i - 1].end) {
      merged[i].start = Math.min(merged[i - 1].end + 0.01, merged[i].end);
    }
  }
  return merged;
}

function extractCandidates(r: LyricsGroupRecommendation): string[] {
  const list = [
    (r as any).selectedEmotionMotion,
    (r as any).selectedGenreMotion,
    (r as any).analyzedMotion1,
    (r as any).analyzedMotion2,
  ].filter(Boolean) as string[];
  return Array.from(new Set(list)).slice(0, 4);
}

export default function DanceRecommendScreen({ route, navigation }: Props) {
  const { p_title } = route.params;

  const [loading, setLoading] = useState(true);
  const [analyzeErr, setAnalyzeErr] = useState<string | null>(null);

  const [recs, setRecs] = useState<LyricsGroupRecommendation[]>([]);
  const [timing, setTiming] = useState<TimingBlock[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [ptrByBlock, setPtrByBlock] = useState<number[]>([]);

  const [motionUrlsMap, setMotionUrlsMap] = useState<Map<string, string>>(new Map());
  const [loadingMotions, setLoadingMotions] = useState(false);

  const [playerMotionId, setPlayerMotionId] = useState<string | null>(null);
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  // 오디오 상태 - 개선된 루프 로직
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoPlayedOnce, setAutoPlayedOnce] = useState(false);
  const lastSeekTimeRef = useRef<number>(0);

  const isFinished = useMemo(() => currentIndex >= recs.length, [currentIndex, recs.length]);

  // ========== 초기 로드 ==========
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { p_emotion, p_genre, p_plainLyrics, p_lyricsJsonRaw } = route.params;

        const plain = sanitizePlainLyrics(p_plainLyrics);
        const words = parseAlignedWords(p_lyricsJsonRaw);
        if (!plain) throw new Error('plain_lyrics가 없습니다.');
        if (words.length === 0) throw new Error('lyrics_json(타이밍)이 없습니다.');

        const analysis = await analyzeLyricsByTwoLines(plain, p_emotion, p_genre);
        if (!Array.isArray(analysis) || analysis.length === 0) {
          throw new Error('가사 분석 결과가 비었습니다.');
        }

        const tBlocks = buildTimingBlocks(words, analysis.length);
        const n = Math.min(analysis.length, tBlocks.length);
        if (n === 0) throw new Error('타이밍 블록 생성 실패');

        setRecs(analysis.slice(0, n));
        setTiming(tBlocks.slice(0, n));
        setPtrByBlock(new Array(n).fill(0));

        setCurrentIndex(0);
        setLoopStart(tBlocks[0].start);
        setLoopEnd(tBlocks[0].end);
        setCurrentTime(tBlocks[0].start);
        setAutoPlayedOnce(false);
      } catch (e: any) {
        console.error('초기 로드 실패:', e);
        setAnalyzeErr(e?.message ?? '초기 로드 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, [route.params]);

  // ========== 후보 바뀔 때 응답 URL 로드 ==========
  useEffect(() => {
    if (loading || isFinished) return;

    const rec = recs[currentIndex];
    if (!rec) return;

    const cands = extractCandidates(rec);
    const ptr = ptrByBlock[currentIndex] ?? 0;
    const motionId = cands[ptr];
    if (!motionId) {
      setPlayerMotionId(null);
      setPlayerUrl(null);
      return;
    }

    (async () => {
      try {
        setLoadingMotions(true);
        const raw = await getMotionUrl(motionId);
        const url = raw.trim().replace(/^"|"$/g, '');
        setMotionUrlsMap(new Map([[motionId, url]]));
        setPlayerMotionId(motionId);
        setPlayerUrl(url);
      } catch (e) {
        setMotionUrlsMap(new Map());
        setPlayerMotionId(null);
        setPlayerUrl(null);
      } finally {
        setLoadingMotions(false);
      }
    })();
  }, [currentIndex, ptrByBlock, recs, loading, isFinished]);

  // ========== 블록 바뀌면 루프 갱신 ==========
  useEffect(() => {
    if (isFinished) {
      setLoopStart(null);
      setLoopEnd(null);
      return;
    }
    const blk = timing[currentIndex];
    if (blk) {
      setLoopStart(blk.start);
      setLoopEnd(blk.end);
      setCurrentTime(blk.start);
      setAutoPlayedOnce(false);

      // 재생 중이면 새 구간으로 즉시 이동
      if (isPlaying) {
        try {
          RNSoundPlayer.seek(blk.start);
          lastSeekTimeRef.current = Date.now();
        } catch {}
      }
    }
  }, [currentIndex, timing, isFinished]);

  // ========== 개선된 오디오 루프 (렉 최소화) ==========
  const audioUrl = route.params.p_filepath;

  const startLoopTicker = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // 200ms로 늘려서 CPU 부하 감소
    const id = setInterval(async () => {
      try {
        const info = await RNSoundPlayer.getInfo();
        const now = info.currentTime || 0;
        setCurrentTime(now);
        setDuration(info.duration || 0);

        if (loopStart != null && loopEnd != null) {
          // seek 직후 0.5초는 체크 건너뛰기 (렉 방지)
          const timeSinceLastSeek = Date.now() - lastSeekTimeRef.current;
          if (timeSinceLastSeek < 500) return;

          // 여유 마진을 0.15초로 늘림
          const MARGIN = 0.15;
          if (now >= loopEnd - MARGIN) {
            try {
              RNSoundPlayer.seek(loopStart);
              lastSeekTimeRef.current = Date.now();
              setCurrentTime(loopStart);
            } catch {}
          }
        }
      } catch {}
    }, 200); // 120ms → 200ms

    intervalRef.current = id;
  };

  const handlePlay = async () => {
    try {
      if (!audioUrl || !(audioUrl.startsWith('http') || audioUrl.startsWith('file'))) {
        Alert.alert('재생 오류', '유효한 오디오 URL이 아닙니다.');
        return;
      }

      await RNSoundPlayer.playUrl(audioUrl);
      setIsPlaying(true);

      if (loopStart != null) {
        setTimeout(() => {
          try {
            RNSoundPlayer.seek(loopStart);
            lastSeekTimeRef.current = Date.now();
          } catch {}
        }, 300);
      }

      startLoopTicker();
    } catch {
      Alert.alert('재생 실패', '오디오를 재생할 수 없어요.');
    }
  };

  const handleStop = () => {
    try { RNSoundPlayer.stop(); } catch {}
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSeek = (value: number) => {
    let v = value;
    if (loopStart != null && loopEnd != null) {
      if (v < loopStart) v = loopStart;
      if (v > loopEnd - 0.05) v = loopEnd - 0.05;
    }
    try {
      RNSoundPlayer.seek(v);
      lastSeekTimeRef.current = Date.now();
    } catch {}
    setCurrentTime(v);
  };

  useEffect(() => {
    return () => {
      try { RNSoundPlayer.stop(); } catch {}
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ========== 자동 재생 ==========
  useEffect(() => {
    if (loading || isFinished) return;
    if (loopStart == null || loopEnd == null) return;
    if (autoPlayedOnce) return;
    handlePlay();
    setAutoPlayedOnce(true);
  }, [loading, isFinished, loopStart, loopEnd, autoPlayedOnce]);

  // ========== 후보 변경/선택 ==========
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

  const [selections, setSelections] = useState<SelectionGroupDto[]>([]);
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

    const lyricsKey = (rec as any).lyrics || (rec as any).lyricsGroup || '';
    setSelections(prev => {
      const list = [...prev];
      const idx = list.findIndex(x => x.lyricsGroup === lyricsKey);
      const item = { lyricsGroup: lyricsKey, selectedMotionIds: [motionId] };
      if (idx >= 0) list[idx] = item; else list.push(item);
      return list;
    });

    setCurrentIndex(i => i + 1);
  };

  // ========== 저장 ==========
  useEffect(() => {
    (async () => {
      if (!isFinished || selections.length === 0) return;
      try {
        const msg = await saveEmotionSelections(selections);
        Alert.alert('완료', msg || '선택한 안무가 저장되었습니다.');
      } catch (e: any) {
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

  const rec = recs[currentIndex];
  const displayedLyrics = ((rec as any)?.lyrics ?? (rec as any)?.lyricsGroup ?? '') as string;
  const lyricsLines = displayedLyrics.split('\n').slice(0, 2);

  const cands = rec ? extractCandidates(rec) : [];
  const ptr = ptrByBlock[currentIndex] ?? 0;

  return (
    <ImageBackground
      source={require('../../assets/background/DanceRecommendBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.motionCard}>
        {!isFinished ? (
          <>
            <View style={styles.lyricsBox}>
              <Text style={styles.lyricLine}>{lyricsLines[0] || ''}</Text>
              <Text style={styles.lyricLine}>{lyricsLines[1] || ''}</Text>
            </View>

            {loadingMotions ? (
              <View style={[styles.video, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 8, color: '#aaa' }}>후보 영상 로딩 중...</Text>
              </View>
            ) : playerUrl ? (
              <Video
                key={playerUrl}
                source={{ uri: playerUrl, type: 'mp4' }}
                style={styles.video}
                resizeMode="cover"
                repeat
                paused={false}
                muted={false}
                onError={(e) => console.error('❌ Video Error =', playerUrl, e)}
              />
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
                disabled={cands.length <= 1 || loadingMotions}
                style={[styles.iconButton, (cands.length <= 1 || loadingMotions) && { opacity: 0.5 }]}
                accessibilityLabel="후보 변경"
              >
                <Image source={ICON_RESET} style={styles.iconImage} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectCurrent}
                disabled={loadingMotions || !playerUrl}
                style={[styles.iconButton, (loadingMotions || !playerUrl) && { opacity: 0.5 }]}
                accessibilityLabel="선택"
              >
                <Image source={ICON_CHECK} style={styles.iconImage} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('RecordScreen')} style={[styles.recordButton]}>
            <Text style={styles.recordText}>녹화하러 가기</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.playerCard}>
        <Text style={styles.nowPlayingText}>{p_title}</Text>

        <View style={styles.playerControls}>
          <TouchableOpacity
            onPress={handleStop}
            accessibilityLabel="일시정지"
          >
            <Image source={ICON_PAUSE} style={styles.playPauseIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePlay}
            accessibilityLabel="재생"
          >
            <Image source={ICON_PLAY} style={styles.playPauseIcon} />
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

  lyricsBox: { marginTop: 4, marginBottom: 10 },
  lyricLine: { fontSize: 16, color: '#111', textAlign: 'center', marginVertical: 2, fontWeight: '600' },

  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#222',
    borderRadius: 12,
  },

  controls: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
  },
  iconButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  iconImage: { width: 22, height: 22, resizeMode: 'contain' },

  recordButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#4B9DFE',
  },
  recordText: { color: '#fff', fontWeight: 'bold' },

  playerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    marginVertical: 10,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  playerControls: {
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
  stopButton: { backgroundColor: '#FE4B4B' },
  controlText: { color: '#fff', fontWeight: 'bold' },

  slider: { width: '100%', height: 40, marginBottom: 6 },
  timeText: { fontSize: 13, color: '#666' },
  nowPlayingText: { fontSize: 16, fontWeight: '700', color: '#333' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  playPauseIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});