// MainScreen.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');

/** cloud2.png 원본 비율 (예: 768x855) */
const CLOUD_ASPECT = 768 / 855;

/** 시작 크기(좌하단에서 적당히 보이게) */
const CLOUD_H0 = H * 0.55;
const CLOUD_W0 = CLOUD_H0 * CLOUD_ASPECT;

/** 화면을 덮기 위한 타깃 스케일 (여유) */
const COVER_SCALE = 3.0;

/** 위치 오프셋: 오른쪽(+X), 아래(+Y) */
const CLOUD_OFFSET_X = W * 0.4; // → 오른쪽으로
const CLOUD_OFFSET_Y = H * 0.17; // ↓ 아래로

export default function MainScreen({ navigation }: any) {
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
    }, [progress])
  );

  // 드래그 중 배경 UI 페이드
  const uiOpacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.2, 0],
  });

  // 90% 이후 완전 덮는 오버레이
  const overlayOpacity = progress.interpolate({
    inputRange: [0.9, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  /** 클라우드 이미지 트랜스폼 */
  const cloudStyle = {
    width: CLOUD_W0,
    height: CLOUD_H0,
    position: 'absolute' as const,
    // 시작: 좌하단 밖 / 끝: 화면 중앙 (오프셋 적용)
    left: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        -CLOUD_W0 * 0.65 + CLOUD_OFFSET_X,
        W / 2 - (CLOUD_W0 * COVER_SCALE) / 2 + CLOUD_OFFSET_X,
      ],
    }),
    bottom: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        -CLOUD_H0 * 0.35 - CLOUD_OFFSET_Y, // 아래로 내리려면 값 더 작게(음수 증가)
        H / 2 - (CLOUD_H0 * COVER_SCALE) / 2 - CLOUD_OFFSET_Y,
      ],
    }),
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, COVER_SCALE],
        }),
      },
      {
        rotate: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-2deg'], // 필요 없으면 둘 다 '0deg'
        }),
      },
    ],
  };

  // 제스처: 루트가 직접 받음
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderMove: (_e, g) => {
        const dy = Math.max(0, -g.dy);          // 위로만
        const p = Math.min(1, dy / (H * 0.8));  // 80% 끌면 1
        progress.setValue(p);
      },
      onPanResponderRelease: (_e, g) => {
        const dy = Math.max(0, -g.dy);
        const passed = dy > H * 0.25;
        Animated.timing(progress, {
          toValue: passed ? 1 : 0,
          duration: passed ? 320 : 220,
          useNativeDriver: false, // left/bottom 보간이라 false
        }).start(() => {
          if (passed) navigation.navigate('Community', { screen: 'MyRoom' });
        });
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* 배경 */}
      <ImageBackground
        source={require('../assets/background/newback.png')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="box-none"
      >
        {/* 드래그 중 페이드되는 UI */}
        <Animated.View style={[styles.uiLayer, { opacity: uiOpacity }]}>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={() =>
              navigation.navigate('Dance', { screen: 'RecordScreen' }, { fileName: 'song1' })
            }
            activeOpacity={0.8}
          >
            <Text style={styles.recordText}>📹 테스트 녹화</Text>
          </TouchableOpacity>
        </Animated.View>
      </ImageBackground>

      {/* ⛅️ 클라우드 이미지 (좌하단→오른쪽 살짝/아래 조금 위치 오프셋 적용) */}
      <Animated.Image
        source={require('../assets/icon/cloud2.png')}
        style={cloudStyle}
        resizeMode="contain"
      />

      {/* 안전 오버레이: 90% 이후 빈틈 제거 */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', opacity: overlayOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E1220' },
  background: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  uiLayer: { padding: 16 },
  recordButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  recordText: { color: '#000' },
});
