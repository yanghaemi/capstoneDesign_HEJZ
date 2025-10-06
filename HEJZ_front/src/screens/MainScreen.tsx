// MainScreen.tsx
import React, { useRef, useCallback } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');
const HEADER_TOUCH_BLOCK = 80; // 상단 80px는 제스처 비활성화 (테스트 버튼 영역)
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

  /** ⛅️ 클라우드 이미지 트랜스폼 */
  const cloudStyle = {
    width: CLOUD_W0,
    height: CLOUD_H0,
    position: 'absolute' as const,
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
        -CLOUD_H0 * 0.35 - CLOUD_OFFSET_Y,
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
          outputRange: ['0deg', '-2deg'],
        }),
      },
    ],
  };

  // 제스처: 상단 HEADER_TOUCH_BLOCK 영역에서는 시작/이동 모두 무시
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.pageY > HEADER_TOUCH_BLOCK,
      onMoveShouldSetPanResponder: (e, g) =>
        e.nativeEvent.pageY > HEADER_TOUCH_BLOCK && Math.abs(g.dy) > 4,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
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
    <View style={styles.container}>
      {/* 제스처 레이어: 상단 HEADER_TOUCH_BLOCK 아래부터만 드래그 활성화 */}
      <View
        style={styles.gestureLayer}
        pointerEvents="box-only"
        {...panResponder.panHandlers}
      />

      {/* 배경 */}
      <ImageBackground
        source={require('../assets/background/newback.png')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.uiLayer, { opacity: uiOpacity }]} />
      </ImageBackground>

      {/* [TEST HEADER] 상단 고정 테스트 버튼 */}
      <View pointerEvents="auto" style={styles.testHeaderWrap}>
        <TouchableOpacity
          style={styles.testButton}
          //onPress={() => navigation.navigate('Test')}
          onPress={() => navigation.navigate('Dance', { screen: 'RecordScreen' })}
          activeOpacity={0.85}
        >
          <Text style={styles.testText}>카메라 테스트</Text>
        </TouchableOpacity>
      </View>
      {/* [/TEST HEADER] */}

      {/* 클라우드 */}
      <Animated.Image
        source={require('../assets/icon/cloud2.png')}
        style={cloudStyle}
        resizeMode="contain"
      />

      {/* 90% 이후 오버레이 */}
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

  // [TEST HEADER]
  testHeaderWrap: {
    position: 'absolute',
    top: Platform.select({ ios: 0, android: 0 }),
    left: 0,
    right: 0,
    // 상단 80px은 제스처 비활성화 영역과 정확히 맞춤
    paddingTop: Platform.select({ ios: 44, android: 16 }), // 대충 안전 영역 보정
    height: HEADER_TOUCH_BLOCK,
    justifyContent: 'center',
    alignItems: 'flex-end', // 우측 상단 정렬 (원하면 'flex-start'로 바꿔)
    paddingHorizontal: 12,
    zIndex: 10,
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  testText: {
    color: '#0E1220',
    fontWeight: '600',
  },
  // [/TEST HEADER]
});
