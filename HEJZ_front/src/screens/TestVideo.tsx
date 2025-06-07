import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import Video from 'react-native-video';

const { width } = Dimensions.get('window');
const videoWidth = width * 0.8;
const videoHeight = videoWidth * 1.3;

const videoUrls = [
  'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gJB_sBM_cAll_d08_mJB0_ch08.mp4?response-content-type=video%2Fmp4&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250607T172832Z&X-Amz-SignedHeaders=host&X-Amz-Credential=AKIA3H2A25ARXGGXU67K%2F20250607%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Expires=600&X-Amz-Signature=bd8810789e3278670397bfd2cd0090e77a744e5579badd45c2ba29670e732581',
    'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gWA_sBM_cAll_d25_mWA0_ch08.mp4?response-content-type=video%2Fmp4&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250607T171435Z&X-Amz-SignedHeaders=host&X-Amz-Credential=AKIA3H2A25ARXGGXU67K%2F20250607%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Expires=600&X-Amz-Signature=d3b67258391adbc8d68491da491081704b06fd12e47499b072041ecbb5ea2ab6',
    'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gWA_sBM_cAll_d26_mWA5_ch03.mp4?response-content-type=video%2Fmp4&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250607T171450Z&X-Amz-SignedHeaders=host&X-Amz-Credential=AKIA3H2A25ARXGGXU67K%2F20250607%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Expires=600&X-Amz-Signature=230d2841b136e5dd028074aa880482a6c8b6265b4b2ab947715a2f9d72acc51c',
    'https://capstone-hejz-bucket.s3.ap-northeast-2.amazonaws.com/videos/videos/gJB_sBM_cAll_d08_mJB0_ch08.mp4?response-content-type=video%2Fmp4&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250607T171506Z&X-Amz-SignedHeaders=host&X-Amz-Credential=AKIA3H2A25ARXGGXU67K%2F20250607%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Expires=600&X-Amz-Signature=1d1c75d4c6a6fa15f00f3a791de8e2b5e4df8efc873425037ba89522d2ea59d9',
];

const VideoSelectionScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);

  const handleVideoTap = () => {
    setSelectedIndex(currentIndex);
  };

  const handleFinalize = () => {
    if (selectedIndex !== null) {
      setIsFinalized(true);
      console.log('✅ 최종 선택된 영상 URL:', videoUrls[selectedIndex]);
      // 여기서 저장 or 서버 전송 등 진행 가능!
    }
  };

  const handleRetry = () => {
    const nextIndex = (currentIndex + 1) % videoUrls.length;
    setCurrentIndex(nextIndex);
    setSelectedIndex(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleVideoTap} activeOpacity={0.9}>
        <Video
          source={{ uri: videoUrls[currentIndex] }}
          style={styles.video}
          resizeMode="cover"
          repeat
          paused={false}
          muted={false}
          onError={(e) => console.log('Video Error:', e)}
        />
        {selectedIndex === currentIndex && (
          <View style={styles.overlay}>
            <Text style={styles.selectedText}>✔ 선택됨</Text>
          </View>
        )}
      </TouchableOpacity>

      {!isFinalized && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.selectButton,
              selectedIndex === currentIndex ? styles.selectButtonActive : styles.selectButtonDisabled,
            ]}
            onPress={handleFinalize}
            disabled={selectedIndex !== currentIndex}
          >
            <Text style={styles.selectButtonText}>선택하기</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>다시하기</Text>
          </TouchableOpacity>
        </View>
      )}
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
});
