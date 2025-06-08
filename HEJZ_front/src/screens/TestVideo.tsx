import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Image } from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import SoundPlayer from 'react-native-sound-player';
import { parseLyricsTiming } from '../../src/parseLyricsTiming';
import lyricsTiming from '../../src/assets/Document/lyricsTiming2.json';

const { width } = Dimensions.get('window');
const videoWidth = width * 0.8;
const videoHeight = videoWidth * 1.3;

const VideoSelectionScreen = () => {
  const lyricsBlocks = useMemo(() => parseLyricsTiming(lyricsTiming.data.alignedWords), []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [videoOffsetIndex, setVideoOffsetIndex] = useState(0);
  const [motionIdGroups, setMotionIdGroups] = useState<string[][]>([]);
  const [videoUrls, setVideoUrls] = useState<string[][]>([]);
  const [selections, setSelections] = useState<{ lyricsGroup: string; selectedMotionIds: string[] }[]>([]);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideoOptions = videoUrls[currentIndex] || [];
  const currentVideoUrl = currentVideoOptions[videoOffsetIndex] || '';
  const selected = selectedIndex === videoOffsetIndex;

  useEffect(() => {
    if (!isLoading) {
      SoundPlayer.loadSoundFile('nosmokingsong', 'mp3');
      SoundPlayer.play();

      pollingRef.current = setInterval(async () => {
        try {
          const info = await SoundPlayer.getInfo();
          setPosition(info.currentTime);
          setDuration(info.duration);
        } catch {}
      }, 500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      SoundPlayer.stop();
    };
  }, [isLoading]);

  const fetchMotionIds = async () => {
    const all: string[][] = [];

    for (let i = 0; i < lyricsBlocks.length; i++) {
      const lyrics = lyricsBlocks[i].lines.join('\n');
      try {
        const res = await fetch('http://52.78.174.239:8080/api/emotion/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lyrics }),
        });
        const data = await res.json();
        const ids = Array.isArray(data) ? data.flatMap((d: any) => d.motionIds || []) : [];
        if (ids.length === 0) {
          console.warn(`⚠️ motionIds 없음: block ${i}\n가사:\n${lyrics}`);
        }

        all.push(ids);
      } catch (e) {
        console.error(`❌ motionId 요청 실패 (block ${i}):`, e);
        all.push([]);
      }
    }

    return all;
  };

  const fetchVideoUrls = async (motionIds: string[]) => {
    if (!motionIds.length) return [''];

    const urls = await Promise.all(
      motionIds.map(async (id) => {
        try {
          const res = await fetch(`http://52.78.174.239:8080/api/motion/${id}`);
          const text = await res.text();
          if (text.startsWith('http')) return text.trim();
          const data = JSON.parse(text);
          return data.videoUrl?.startsWith('http') ? data.videoUrl : '';
        } catch {
          return '';
        }
      })
    );

    const validUrls = urls.filter(Boolean);
    if (!validUrls.length) console.warn(`⚠️ URL 없음: motionIds = ${motionIds}`);
    return validUrls.length > 0 ? validUrls : [''];
  };

  useEffect(() => {
    (async () => {
      const motions = await fetchMotionIds();
      setMotionIdGroups(motions);

      const videos = await Promise.all(motions.map(fetchVideoUrls));
      setVideoUrls(videos);

      console.log('✅ 모든 videoUrls:', videos);
      setIsLoading(false);
    })();
  }, []);

  const handleVideoPress = () => {
    setSelectedIndex((prev) => (prev === null ? videoOffsetIndex : null));
  };

  const handleRetry = () => {
    if (!currentVideoOptions.length) return;
    const next = (videoOffsetIndex + 1) % currentVideoOptions.length;
    setVideoOffsetIndex(next);
    setSelectedIndex(null);
  };

  const handleFinalize = () => {
    if (selectedIndex === null) return;
    const selectedMotionId = motionIdGroups[currentIndex]?.[selectedIndex];
    const lyricsGroup = lyricsBlocks[currentIndex]?.lines.join('\n');

    if (selectedMotionId && lyricsGroup) {
      const newSelection = { lyricsGroup, selectedMotionIds: [selectedMotionId] };
      setSelections((prev) => [...prev, newSelection]);
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setVideoOffsetIndex(0);
    }
  };

  useEffect(() => {
    if (currentIndex >= lyricsBlocks.length && selections.length > 0) {
      fetch('http://52.78.174.239:8080/api/emotion/selection/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selections),
      })
        .then(() => console.log('✅ 선택 저장 완료'))
        .catch(console.error);
    }
  }, [currentIndex]);

  const handleSeek = (value: number) => {
    SoundPlayer.seek(value);
    setPosition(value);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('../../src/assets/background/Loadingbackground.png')}
          style={styles.loadingImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleVideoPress} activeOpacity={0.9}>
        {currentVideoUrl ? (
          <Video
            source={{ uri: currentVideoUrl }}
            style={styles.video}
            resizeMode="cover"
            repeat
            paused={false}
            muted={false}
          />
        ) : (
          <View style={[styles.video, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#fff' }}>⚠️ 영상 없음</Text>
          </View>
        )}
        {selected && (
          <View style={styles.overlay}>
            <Text style={styles.selectedText}>✔ 선택됨</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.lyricsContainer}>
        {lyricsBlocks[currentIndex]?.lines.map((line, idx) => (
          <Text key={idx} style={styles.lyricLine}>{line}</Text>
        ))}
      </View>

      <Slider
        style={{ width: '90%', marginTop: 10 }}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor="#FFFFFF"
        maximumTrackTintColor="#888"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.selectButton, selected ? styles.selectButtonActive : styles.selectButtonDisabled]}
          onPress={handleFinalize}
          disabled={!selected}
        >
          <Text style={styles.selectButtonText}>선택하기</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>다시하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoSelectionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  video: { width: videoWidth, height: videoHeight, backgroundColor: '#000', borderRadius: 12 },
  overlay: {
    position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8, borderRadius: 8,
  },
  selectedText: { color: '#000', fontWeight: 'bold' },
  lyricsContainer: { marginTop: 20, alignItems: 'center' },
  lyricLine: { fontSize: 16, color: '#fff', textAlign: 'center', marginVertical: 2 },
  buttonRow: { marginTop: 20, flexDirection: 'row', gap: 20, justifyContent: 'space-around', width: '100%' },
  selectButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  selectButtonActive: { backgroundColor: '#4CAF50' },
  selectButtonDisabled: { backgroundColor: '#999' },
  selectButtonText: { color: '#fff', fontSize: 16 },
  retryButton: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  retryText: { fontSize: 16, color: '#333', fontWeight: 'bold' },
  loadingContainer: { flex: 1, backgroundColor: '#000' },
  loadingImage: { width: '100%', height: '100%' },
});
