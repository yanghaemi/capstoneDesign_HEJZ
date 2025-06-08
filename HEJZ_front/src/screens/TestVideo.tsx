import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Video from 'react-native-video';
import { parseLyricsTiming } from '../../src/parseLyricsTiming';
import lyricsTiming from '../../src/assets/Document/lyricsTiming2.json';
import SoundPlayer from 'react-native-sound-player';
const { width } = Dimensions.get('window');
const videoWidth = width * 0.8;
const videoHeight = videoWidth * 1.3;

const VideoSelectionScreen = () => {
    useEffect(() => {
      const { start, end } = lyricsBlocks[currentIndex];

      try {
        SoundPlayer.stop(); // 기존 재생 멈추고
        SoundPlayer.setVolume(1);
        SoundPlayer.playSoundFile('nosmokingsong', 'mp3');

        setTimeout(() => {
          SoundPlayer.seek(start);
        }, 300);

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
          try {
            const info = await SoundPlayer.getInfo();
            if (info.currentTime >= end) {
              SoundPlayer.seek(start);
            }
          } catch {}
        }, 500);
      } catch (e) {
        console.error('Sound error:', e);
      }

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [currentIndex]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [videoOffsetIndex, setVideoOffsetIndex] = useState(0);
  const [motionIdGroups, setMotionIdGroups] = useState<string[][]>([]);
  const [videoUrls, setVideoUrls] = useState<string[][]>([]);
  const [selections, setSelections] = useState<{ lyricsGroup: string; selectedMotionIds: string[] }[]>([]);
  const [audioPosition, setAudioPosition] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<Video>(null);

  const lyricsBlocks = parseLyricsTiming(lyricsTiming.data.alignedWords);

  const fetchMotionIds = async () => {
    const all: string[][] = [];
    for (let block of lyricsBlocks) {
      const lyrics = block.lines.join('\n');
      try {
        const res = await fetch('http://52.78.174.239:8080/api/emotion/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lyrics }),
        });
        const data = await res.json();
        const ids = Array.isArray(data) ? data.flatMap((d: any) => d.motionIds || []) : [];
        all.push(ids);
      } catch (e) {
        console.error('motionId 요청 실패:', e);
        all.push([]);
      }
    }
    return all;
  };

  const fetchVideoUrls = async (motionIds: string[]) => {
    const urls = await Promise.all(
      motionIds.map(async (id) => {
        try {
          const res = await fetch(`http://52.78.174.239:8080/api/motion/${id}`, {
            method: 'GET',
          });

          const text = await res.text();

          // ✅ 응답이 바로 URL 형태라면
          if (text.startsWith('http')) {
            return text.trim();
          }

          // ✅ 아니면 JSON으로 파싱 시도
          const data = JSON.parse(text);
          return data.videoUrl || '';
        } catch (e) {
          console.log(`motionId ${id} 처리 실패:`, e);
          return '';
        }
      })
    );
    console.log('videoUrls:', videoUrls);
    return urls.filter(Boolean);
  };


  useEffect(() => {
    (async () => {
      const motions = await fetchMotionIds();
      setMotionIdGroups(motions);
      const videos = await Promise.all(motions.map(fetchVideoUrls));
      setVideoUrls(videos);
    })();
  }, []);

  useEffect(() => {
    const block = lyricsBlocks[currentIndex];
    if (!block) return;

    setAudioPosition(block.start);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      audioRef.current?.seek(block.start);
    }, (block.end - block.start) * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex]);

  const handleVideoPress = () => {
    setSelectedIndex((prev) => (prev === null ? videoOffsetIndex : null));
  };

  const handleRetry = () => {
    const currentVideos = videoUrls[currentIndex];
    if (!currentVideos || currentVideos.length === 0) return;
    const next = (videoOffsetIndex + 1) % currentVideos.length;
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
      }).catch(e => console.error('선택 저장 실패:', e));
    }
  }, [currentIndex]);

  const currentVideoUrl = videoUrls[currentIndex]?.[videoOffsetIndex] || '';
  const selected = selectedIndex === videoOffsetIndex;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleVideoPress} activeOpacity={0.9}>
        <Video
          source={{ uri: currentVideoUrl }}
          style={styles.video}
          resizeMode="cover"
          repeat
          paused={false}
          muted={false}
        />
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
  buttonRow: { marginTop: 20, flexDirection: 'row', gap: 20 },
  selectButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  selectButtonActive: { backgroundColor: '#4CAF50' },
  selectButtonDisabled: { backgroundColor: '#999' },
  selectButtonText: { color: '#fff', fontSize: 16 },
  retryButton: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  retryText: { fontSize: 16, color: '#333', fontWeight: 'bold' },
});
