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
const HEADER_TOUCH_BLOCK = 80; // 상단(테스트 버튼) 터치 보장 영역

/** cloud2.png 원본 비율 (예: 768x855) */
const CLOUD_ASPECT = 768 / 855;
/** 시작 크기(좌하단에서 적당히 보이게) */
const CLOUD_H0 = H * 0.55;
const CLOUD_W0 = CLOUD_H0 * CLOUD_ASPECT;
/** 화면 덮는 스케일 */
const COVER_SCALE = 3.0;
/** 위치 오프셋: 오른쪽(+X), 아래(+Y) */
const CLOUD_OFFSET_X = W * 0.4; // →
const CLOUD_OFFSET_Y = H * 0.17; // ↓

export default function MainScreen({ navigation }: any) {
  const progress = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
    }, [progress])
  );

  // 드래그 중 페이드
  const uiOpacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.2, 0],
  });

  // 90% 이후 오버레이(빈틈 제거)
  const overlayOpacity = progress.interpolate({
    inputRange: [0.9, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // 클라우드 트랜스폼
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

  // PanResponder: 캡처를 강제로 켜서 다른 뷰가 가로채지 못하게
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 2 || Math.abs(g.dx) > 2,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,

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
          if (passed) navigation.navigate('Community', {
                        screen: 'MyRoom',
                        params: { refresh: Date.now() },
                        merge: true,
                      });
        });
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* 배경 */}
      <ImageBackground
        source={require('../assets/background/newback.png')}
        style={styles.background}
        resizeMode="cover"
        pointerEvents="box-none"
      >
        {/* 드래그 중 페이드되는 UI */}
        <Animated.View style={[styles.uiLayer, { opacity: uiOpacity }]} />
      </ImageBackground>

      {/* ⛅️ 클라우드 이미지 (터치 비간섭) */}
      <Animated.Image
        source={require('../assets/icon/cloud2.png')}
        style={cloudStyle}
        resizeMode="contain"
        pointerEvents="none"
      />

      {/* 90% 이후 빈틈 제거 오버레이 */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', opacity: overlayOpacity }]}
      />

      {/* [TEST HEADER] 상단 고정 테스트 버튼 */}
      <View style={styles.testHeaderWrap} pointerEvents="auto">
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => navigation.navigate('Test')}
          activeOpacity={0.85}
        >
          <Text style={styles.testText}>카메라 테스트</Text>
        </TouchableOpacity>
      </View>
      {/* [/TEST HEADER] */}

      {/* 🔝 제스처 레이어: 화면 맨 위, 상단 80px 비우고 터치 전담 */}
      <View
        style={styles.gestureLayer}
        pointerEvents="box-only"
        collapsable={false}
        {...panResponder.panHandlers}
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
    top: 0, left: 0, right: 0,
    height: HEADER_TOUCH_BLOCK,
    paddingHorizontal: 12,
    paddingTop: Platform.select({ ios: 12, android: 8 }),
    justifyContent: 'center',
    alignItems: 'flex-end', // 우측 상단
    zIndex: 10,
    elevation: 10,
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  testText: { color: '#0E1220', fontWeight: '600' },
  // [/TEST HEADER]

  // 제스처 레이어(맨 위)
  gestureLayer: {
    ...StyleSheet.absoluteFillObject,
    top: HEADER_TOUCH_BLOCK,     // 상단은 비워서 헤더 클릭 가능
    zIndex: 9999,
    elevation: 9999,             // 안드로이드 zIndex 반영 보장
    // backgroundColor: 'rgba(0,255,0,0.06)', // 디버깅용: 잠깐 켜서 레이아웃 확인
  },
});
