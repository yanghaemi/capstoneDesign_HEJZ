// 안무 추천 페이지 (정리 버전)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ImageBackground, Alert, Image, ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
// 이름 충돌 방지 별칭
import RNCSlider from '@react-native-community/slider';
import RNSoundPlayer from 'react-native-sound-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// 필요 JSON/유틸 (없으면 주석 처리하고 빌드 먼저 통과)
import lyricsTiming from '../../../src/assets/Document/lyricsTiming3.json';
import { parseLyricsTiming } from '../../../src/parseLyricsTiming';

type Props = {
  route: { params: { p_id: string; p_title: string; p_filepath: string } };
  navigation: any;
};

const DanceRecommendScreen = ({ route, navigation }: Props) => {
  const { p_id, p_title, p_filepath } = route.params;

  // ─── 재생/진행 상태 ─────────────────────────────────────────────
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── 곡/화면 기본 상태 ──────────────────────────────────────────
  const [id] = useState(p_id);
  const [title] = useState(p_title);
  const [fileUrl] = useState(p_filepath); // 비디오 소스에 사용

  // ─── 가사 블록(2줄 단위 가정) ───────────────────────────────────
  const [lyricsBlocks, setLyricsBlocks] = useState<{ lines: string[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ─── 모션/영상 관련 상태(우선 빌드 통과용 기본값) ────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [motionIdGroups, setMotionIdGroups] = useState<string[][]>([]);
  const [videoUrls, setVideoUrls] = useState<string[][]>([]);
  const [videoOffsetIndex, setVideoOffsetIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selections, setSelections] = useState<{ lyricsGroup: string; selectedMotionIds: string[] }[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // 현재 블록의 비디오 후보들
  const currentVideoOptions = videoUrls[currentIndex] || [];

  // ─── 초기화 ────────────────────────────────────────────────────
  const resetCurrentTime = () => {
    setCurrentTime(0);
    setDuration(0);
  };

  useEffect(() => {
    resetCurrentTime();
    // 가사 파싱 (없는 경우 안전 처리)
    try {
      const blocks = parseLyricsTiming
        ? (parseLyricsTiming as any)(lyricsTiming)
        : [];
      // parse 결과 형태가 {lines:string[]} 배열이라고 가정
      setLyricsBlocks(Array.isArray(blocks) ? blocks : []);
    } catch (e) {
      console.log('lyrics parse fail:', e);
      setLyricsBlocks([]);
    }
    setIsLoading(false);
  }, []);

  // ─── 재생/정지/탐색 ────────────────────────────────────────────
  const handlePlay = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // 로컬 리소스라면 (예: android/app/src/main/res/raw 에 song1.mp3 넣어둔 경우)
      // RNSoundPlayer.playSoundFile('song1', 'mp3');

      // 파일 경로가 있을 때 URL로 재생 (필요에 맞게 선택)
      if (fileUrl?.startsWith('http') || fileUrl?.startsWith('file')) {
        await RNSoundPlayer.playUrl(fileUrl);
      } else {
        // 기본 예시: raw에 있는 song1.mp3
        RNSoundPlayer.playSoundFile('song1', 'mp3');
      }

      setTimeout(() => {
        RNSoundPlayer.seek(currentTime);
      }, 300);

      const id = setInterval(async () => {
        try {
          const info = await RNSoundPlayer.getInfo();
          setCurrentTime(info.currentTime || 0);
          setDuration(info.duration || 0);
        } catch (e) {
          console.log('getInfo 에러:', e);
        }
      }, 500);
      intervalRef.current = id;
    } catch (e) {
      Alert.alert('재생 실패', '오디오 파일을 찾을 수 없어요.');
      console.error('로컬 재생 실패:', e);
    }
  };

  const handleStop = () => {
    try {
      RNSoundPlayer.stop();
    } catch {}
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSeek = (value: number) => {
    try {
      RNSoundPlayer.seek(value);
    } catch {}
    setCurrentTime(value);
  };

  // ─── 모션/영상(나중에 API 붙일 때 활성화) ────────────────────────
  // TODO: 누나가 쓰던 fetchMotionIds / fetchVideoUrls 복원 시, 아래 set*들 사용
  // useEffect(() => { ... }, []);

  // 완료 시 선택 결과 저장 (기존 로직 유지)
  useEffect(() => {
    if (currentIndex >= lyricsBlocks.length && selections.length > 0) {
      const selectedMotionIds = selections.map((sel) => sel.selectedMotionIds[0]);

      AsyncStorage.setItem('selectedMotionIds', JSON.stringify(selectedMotionIds))
        .then(() => console.log('✅ motionId 배열 저장 완료'))
        .catch((err) => console.error('❌ 저장 실패:', err));

      fetch('http://52.78.174.239:8080/api/emotion/selections/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedMotionIds),
      })
        .then(() => console.log('✅ 서버 저장 완료'))
        .catch((err) => console.error('❌ 서버 저장 실패:', err));
    }
  }, [currentIndex]);

  // ─── 녹화 화면 이동 ─────────────────────────────────────────────
  const goToRecordScreen = () => {
    handleStop();
    navigation.navigate('RecordScreen');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B9DFE" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../../src/assets/background/DanceRecommendBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* 비디오 미리보기(선택) */}
      {fileUrl ? (
        <Video
          source={{ uri: fileUrl }}
          style={styles.video}
          controls
          resizeMode="contain"
          paused={false}
        />
      ) : null}

      <View style={styles.playerCard}>
        <Text style={styles.nowPlayingText}>⏱ 재생 중: {title}</Text>

        <View style={styles.controls}>
          <TouchableOpacity onPress={handleStop} style={[styles.controlButton, styles.stopButton]}>
            <Text style={styles.controlText}>⏸️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlay} style={[styles.controlButton, styles.playButton]}>
            <Text style={styles.controlText}>▶️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetCurrentTime} style={[styles.controlButton, styles.resetButton]}>
            <Text style={styles.controlText}>⏹️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lyricsContainer}>
          {lyricsBlocks[currentIndex]?.lines?.map((line, idx) => (
            <Text key={idx} style={styles.lyricLine}>{line}</Text>
          )) || <Text style={styles.lyricLine}>가사 없음</Text>}
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
};

export default DanceRecommendScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  playerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginVertical: 20,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playButton: {
    backgroundColor: '#4B9DFE',
  },
  resetButton: {
    backgroundColor: '#81C147',
  },
  stopButton: {
    backgroundColor: '#FE4B4B',
  },
  controlText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lyricsContainer: {
    width: '100%',
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  lyricLine: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 2,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  nowPlayingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});
