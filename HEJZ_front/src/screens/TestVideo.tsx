import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import Video from 'react-native-video';
import SoundPlayer from 'react-native-sound-player';
import lyricsData from '../assets/Document/lyricsTiming.json';

const { width } = Dimensions.get('window');
const videoWidth = width * 0.8;
const videoHeight = videoWidth * 1.3;

const videoUrls = [
  'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gJB_sBM_cAll_d08_mJB0_ch08.mp4?...',
  'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gWA_sBM_cAll_d25_mWA0_ch08.mp4?...',
  'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gWA_sBM_cAll_d26_mWA5_ch03.mp4?...',
  'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gJB_sBM_cAll_d08_mJB0_ch08.mp4?...'
];

const lyricSegments = lyricsData["song1"] || [];

const VideoSelectionScreen = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const { start, end, lines } = lyricSegments[currentLyricIndex % lyricSegments.length];
    setCurrentLyrics(lines);
    try {
      SoundPlayer.playSoundFile('song1', 'mp3');
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
  }, [currentLyricIndex]);

  const handleVideoTap = () => {
    setSelectedIndex(currentVideoIndex);
  };

  const handleFinalize = () => {
    if (selectedIndex !== null) {
      console.log('✅ 최종 선택된 영상 URL:', videoUrls[selectedIndex]);
      setIsFinalized(false); // 다시 버튼 보이게
      setCurrentLyricIndex((prev) => prev + 1);
      setCurrentVideoIndex(0);
      setSelectedIndex(null);
    }
  };

  const handleRetry = () => {
    const nextVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
    setCurrentVideoIndex(nextVideoIndex);
    setSelectedIndex(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleVideoTap} activeOpacity={0.9}>
        <Video
          source={{ uri: videoUrls[currentVideoIndex] }}
          style={styles.video}
          resizeMode="cover"
          repeat
          paused={false}
          muted={false}
          onError={(e) => console.log('Video Error:', e)}
        />
        {selectedIndex === currentVideoIndex && (
          <View style={styles.overlay}>
            <Text style={styles.selectedText}>✔ 선택됨</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.lyricsContainer}>
        {currentLyrics.map((line, idx) => (
          <Text key={idx} style={styles.lyricLine}>{line}</Text>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.selectButton,
            selectedIndex === currentVideoIndex ? styles.selectButtonActive : styles.selectButtonDisabled,
          ]}
          onPress={handleFinalize}
          disabled={selectedIndex !== currentVideoIndex}
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
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  video: {
    width: videoWidth,
    height: videoHeight,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 8,
    borderRadius: 8,
  },
  selectedText: {
    color: '#000',
    fontWeight: 'bold',
  },
  buttonRow: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 20,
  },
  selectButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectButtonActive: {
    backgroundColor: '#4CAF50',
  },
  selectButtonDisabled: {
    backgroundColor: '#999',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  lyricsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  lyricLine: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 2,
  },
});
