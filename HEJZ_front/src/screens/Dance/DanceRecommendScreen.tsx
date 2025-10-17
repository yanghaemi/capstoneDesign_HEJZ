// src/screens/DanceRecommendScreen.tsx
// Lyrics.txt(문자열) → 2줄씩 분석 POST / 구간 반복 재생은 lyricsTiming.json으로
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
import RNCSlider from '@react-native-community/slider';
import RNSoundPlayer from 'react-native-sound-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

// ★ 파일 위치
// - Android: android/app/src/main/assets/Lyrics.txt  (없으면 assets 폴더 만들기)
// - 타이밍 JSON은 프로젝트 자산으로 import (아래 경로를 네 프로젝트에 맞게 조정)
import timingWords from '../../../src/assets/Document/lyricsTiming.json'; // [{word,startS,endS},...]

// ================== 유틸: 텍스트 → 2줄 블록 ==================
type TextBlock = { lines: [string, string] };

// 섹션 태그([Verse] 등) 제거하고 2줄씩 묶기
function splitLyricsToBlocks(lyricsText: string): TextBlock[] {
  const cleaned = (lyricsText || '').replace(/\[(.*?)\]/g, '').trim();
  const lines = cleaned
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const out: TextBlock[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    out.push({ lines: [lines[i] ?? '', lines[i + 1] ?? ' '] });
  }
  return out;
}

// ================== 유틸: 타이밍 → 2줄 블록 ==================
type AlignedWord = { word: string; startS: number; endS: number };
type TimingBlock = { lines: [string, string]; start: number; end: number };

function timingToBlocks(words: AlignedWord[]): TimingBlock[] {
  const lines: { text: string; start: number; end: number }[] = [];
  let cur = '';
  let lineStart: number | null = null;
  let lastEnd: number | null = null;

  const flush = () => {
    const t = cur.replace(/\[(.*?)\]/g, '').trim();
    if (t && lineStart != null && lastEnd != null) {
      lines.push({ text: t, start: lineStart, end: lastEnd });
    }
    cur = '';
    lineStart = null;
    lastEnd = null;
  };

  for (const w of (words || []) as AlignedWord[]) {
    const parts = String(w.word ?? '').split('\n'); // 같은 토큰 내 \n 처리
    for (let i = 0; i < parts.length; i++) {
      if (cur === '') lineStart = w.startS;
      cur += parts[i];
      lastEnd = w.endS;
      if (i < parts.length - 1) flush(); // 개행이 있었음 → 라인 종료
      else cur += ' '; // 단어 간 공백
    }
  }
  flush();

  const blocks: TimingBlock[] = [];
  for (let i = 0; i < lines.length; i += 2) {
    const l1 = lines[i];
    const l2 = lines[i + 1];
    if (l2) blocks.push({ lines: [l1.text, l2.text], start: l1.start, end: l2.end });
    else blocks.push({ lines: [l1.text, ' '], start: l1.start, end: l1.end });
  }
  return blocks;
}

// ================== 유틸: 블록 정렬(길이가 다르면 최소 길이 기준) ==================
type AlignedBlock = { lines: [string, string]; start: number; end: number };

function alignBlocksSimple(textBlocks: TextBlock[], timingBlocks: TimingBlock[]): AlignedBlock[] {
  const n = Math.min(textBlocks.length, timingBlocks.length);
  const out: AlignedBlock[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      lines: textBlocks[i].lines,
      start: timingBlocks[i].start,
      end: timingBlocks[i].end,
    });
  }
  return out;
}

// ================== API 공통 ==================
const API_BASE = 'http://52.78.174.239:8080';

async function authHeaders() {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getText(url: string): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// 블록(2줄) 단위 분석 요청
async function analyzeTwoLines(pair: string, emotion?: string, genre?: string) {
  const headers = await authHeaders();
  const body: any = { lyrics: pair };
  if (emotion) body.selectedEmotion = emotion;
  if (genre) body.selectedGenre = genre;

  const res = await fetch(`${API_BASE}/api/emotion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    throw new Error(raw || `HTTP ${res.status}`);
  }
  const json = await res.json().catch(() => ({}));
  const r = Array.isArray(json?.lyricsRecommendations) ? json.lyricsRecommendations[0] : json;
  const candidates = [
    r?.selectedEmotionMotion,
    r?.selectedGenreMotion,
    r?.analyzedMotion1,
    r?.analyzedMotion2,
  ].filter(Boolean) as string[];
  return candidates;
}

// 동시성 제한 병렬 분석(기본 3)
async function analyzeBlocks(textBlocks: TextBlock[], concurrency = 3) {
  const n = textBlocks.length;
  const out: string[][] = Array.from({ length: n }, () => []);
  let inFlight = 0;
  let idx = 0;

  return new Promise<string[][]>((resolve) => {
    const spawn = () => {
      while (inFlight < concurrency && idx < n) {
        const i = idx++;
        inFlight++;
        const pair = `${textBlocks[i].lines[0]}\n${textBlocks[i].lines[1]}`;
        analyzeTwoLines(pair)
          .then((cands) => { out[i] = cands; })
          .catch((e) => { console.log('analyze fail', i, e); out[i] = []; })
          .finally(() => {
            inFlight--;
            if (idx < n) spawn();
            else if (inFlight === 0) resolve(out);
          });
      }
    };
    spawn();
  });
}

// ================== 화면 ==================
type Props = {
  route: { params: { p_title: string; p_filepath: string } };
  navigation: any;
};

export default function DanceRecommendScreen({ route, navigation }: Props) {
  const { p_title, p_filepath } = route.params;

  // 오디오 상태
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 블록/루프/추천
  const [blocks, setBlocks] = useState<AlignedBlock[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  const [recsByBlock, setRecsByBlock] = useState<string[][]>([]);
  const [ptrByBlock, setPtrByBlock] = useState<number[]>([]);
  const [currentMotionUrl, setCurrentMotionUrl] = useState<string | null>(null);
  const [loadingMotion, setLoadingMotion] = useState(false);
  const [loading, setLoading] = useState(true);

  // 선택 누적
  const [selections, setSelections] = useState<{ lyricsGroup: string; selectedMotionIds: string[] }[]>([]);

  const isFinished = useMemo(() => currentIndex >= blocks.length, [currentIndex, blocks.length]);

  // 1) 초기: Lyrics.txt 읽기 → 2줄 블록 / timingWords → 2줄 타이밍 → 정렬 → 블록 배열 구성
  useEffect(() => {
    (async () => {
      try {
        // 텍스트(분석용)
        const lyricsText = await RNFS.readFileAssets('Lyrics.txt', 'utf8'); // Android assets
        const textBlocks = splitLyricsToBlocks(lyricsText);

        // 타이밍(루프용)
        const timingBlocks = timingToBlocks(timingWords as AlignedWord[]);

        // 정렬(길이 다르면 최소값 기준)
        const aligned = alignBlocksSimple(textBlocks, timingBlocks);
        if (!aligned.length) throw new Error('블록이 없습니다.');
        setBlocks(aligned);

        // 2) 블록별 2줄만 body에 넣어 분석 (동시성 3)
        const recs = await analyzeBlocks(textBlocks, 3);
        setRecsByBlock(recs);
        setPtrByBlock(new Array(recs.length).fill(0));

        // 첫 루프 구간
        setLoopStart(aligned[0].start);
        setLoopEnd(aligned[0].end);
      } catch (e: any) {
        Alert.alert('오류', e?.message ?? '가사/타이밍 로드 실패');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2) 현재 블록/포인터 변경 시 presigned URL 로드
  useEffect(() => {
    if (loading || isFinished) { setCurrentMotionUrl(null); return; }
    const recs = recsByBlock[currentIndex] || [];
    const ptr = ptrByBlock[currentIndex] ?? 0;
    const motionId = recs[ptr];
    if (!motionId) { setCurrentMotionUrl(null); return; }

    (async () => {
      try {
        setLoadingMotion(true);
        const url = await getText(`${API_BASE}/api/motion/${encodeURIComponent(motionId)}`);
        setCurrentMotionUrl(url);
      } catch {
        setCurrentMotionUrl(null);
      } finally {
        setLoadingMotion(false);
      }
    })();
  }, [currentIndex, ptrByBlock, recsByBlock, loading, isFinished]);

  // 3) 블록 바뀌면 루프 구간 갱신
  useEffect(() => {
    if (isFinished) { setLoopStart(null); setLoopEnd(null); return; }
    const blk = blocks[currentIndex];
    if (blk) {
      setLoopStart(blk.start);
      setLoopEnd(blk.end);
      try { RNSoundPlayer.seek(blk.start + 0.01); } catch {}
      setCurrentTime(blk.start);
    }
  }, [currentIndex, blocks, isFinished]);

  // 4) 후보 없으면 자동 스킵
  useEffect(() => {
    if (loading || isFinished) return;
    const total = recsByBlock[currentIndex]?.length ?? 0;
    if (total === 0) setCurrentIndex(i => i + 1);
  }, [currentIndex, recsByBlock, loading, isFinished]);

  // 5) 플레이/정지/탐색(+루프)
  const audioUrl = p_filepath;
  const handlePlay = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioUrl?.startsWith('http') || audioUrl?.startsWith('file')) {
        await RNSoundPlayer.playUrl(audioUrl);
      } else {
        RNSoundPlayer.playSoundFile('song1', 'mp3'); // 앱 번들 mp3 사용시
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

  // 6) 후보 순환/선택/저장
  const cycleCandidate = () => {
    const total = recsByBlock[currentIndex]?.length ?? 0;
    if (total <= 1) return;
    setPtrByBlock(prev => {
      const next = [...prev];
      next[currentIndex] = ((prev[currentIndex] ?? 0) + 1) % total;
      return next;
    });
  };
  const selectCurrent = async () => {
    if (isFinished) return;
    const recs = recsByBlock[currentIndex] || [];
    const ptr = ptrByBlock[currentIndex] ?? 0;
    const motionId = recs[ptr];
    if (!motionId) return Alert.alert('알림', '선택할 후보가 없어요.');

    const lyr = blocks[currentIndex]?.lines ?? ['', ''];
    const lyricsGroup = `${lyr[0]}\n${lyr[1]}`;
    setSelections(prev => {
      const x = [...prev];
      const idx = x.findIndex(s => s.lyricsGroup === lyricsGroup);
      if (idx >= 0) x[idx] = { lyricsGroup, selectedMotionIds: [motionId] };
      else x.push({ lyricsGroup, selectedMotionIds: [motionId] });
      return x;
    });
    setCurrentIndex(i => i + 1);
  };

  // 7) 마지막에 bulk 저장 + 최종 확정
  useEffect(() => {
    if (!isFinished || !selections.length) return;
    (async () => {
      try {
        const headers = await authHeaders();
        // bulk 저장
        await fetch(`${API_BASE}/api/emotion/selection/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
          body: JSON.stringify(selections),
        }).then(r => { if (!r.ok) throw new Error('bulk 실패'); });

        // 최종 확정
        const ids = selections.map(s => s.selectedMotionIds[0]).filter(Boolean);
        const res = await fetch(`${API_BASE}/api/emotion/selections/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8', ...headers },
          body: JSON.stringify(ids),
        });
        if (!res.ok) throw new Error('확정 실패');
        const j = await res.json().catch(() => ({}));
        await AsyncStorage.setItem('selectedMotionIds', JSON.stringify(ids));
        Alert.alert('완료', j?.message || '선택한 안무가 저장되었습니다.');
      } catch (e: any) {
        Alert.alert('오류', e?.message ?? '저장 중 오류가 발생했어요.');
      }
    })();
  }, [isFinished, selections]);

  // 8) 녹화 화면 이동
  const goToRecordScreen = () => {
    handleStop();
    navigation.navigate('RecordScreen');
  };

  // ========== 렌더 ==========
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B9DFE" />
        <Text style={{ color: '#fff', marginTop: 12 }}>블록별 추천 분석 중…</Text>
      </View>
    );
  }

  const blkCnt = blocks.length;
  const cur = blocks[currentIndex];
  const currentCandidates = recsByBlock[currentIndex] || [];
  const ptr = ptrByBlock[currentIndex] ?? 0;

  return (
    <ImageBackground
      source={require('../../../src/assets/background/DanceRecommendBackground.png')}
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
              {cur?.lines?.map((ln, i) => (
                <Text key={i} style={styles.lyricLine}>{ln}</Text>
              ))}
            </View>

            <Text style={styles.candidateBadgeText}>
              {currentCandidates.length ? `후보 ${ptr + 1}/${currentCandidates.length}` : '후보 없음'}
            </Text>

            {loadingMotion ? (
              <View style={[styles.video, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator />
              </View>
            ) : currentMotionUrl ? (
              <Video
                source={{ uri: currentMotionUrl }}
                style={styles.video}
                controls
                resizeMode="contain"
                paused={false}
                repeat
              />
            ) : (
              <View style={[styles.video, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text>영상 없음</Text>
              </View>
            )}

            <View style={styles.controls}>
              <TouchableOpacity onPress={cycleCandidate} style={[styles.controlButton, styles.resetButton]}>
                <Text style={styles.controlText}>⏹ 후보변경</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={selectCurrent} style={[styles.controlButton, styles.playButton]}>
                <Text style={styles.controlText}>✔ 선택</Text>
              </TouchableOpacity>
            </View>

            {currentCandidates.length === 0 && (
              <TouchableOpacity
                onPress={() => setCurrentIndex(i => i + 1)}
                style={[styles.controlButton, styles.resetButton]}
              >
                <Text style={styles.controlText}>다음 블록으로</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity onPress={goToRecordScreen} style={[styles.controlButton, styles.playButton]}>
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

        <RNCSlider
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

// ================== 스타일 ==================
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
  video: { width: '100%', height: 220, backgroundColor: '#000', borderRadius: 12 },

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

  lyricLine: { fontSize: 16, color: '#333', textAlign: 'center', marginVertical: 2 },

  slider: { width: '100%', height: 40, marginBottom: 6 },
  timeText: { fontSize: 13, color: '#666' },
  nowPlayingText: { fontSize: 16, fontWeight: '700', color: '#333' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
});
