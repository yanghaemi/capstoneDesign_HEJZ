// src/screens/TestScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
  Platform, PermissionsAndroid,
} from 'react-native';
import { Camera, useCameraDevice, type CameraDevice } from 'react-native-vision-camera';
import Video from 'react-native-video'; // ← 오디오/오버레이 둘 다 씀
import CRDefault, { CameraRoll as CRNamed } from '@react-native-camera-roll/camera-roll';
const CameraRoll = (CRNamed ?? CRDefault) as {
  save: (uri: string, opts?: { type?: 'photo' | 'video'; album?: string }) => Promise<string>;
};

export default function TestScreen() {
  // 전/후면 전환
  const [useFront, setUseFront] = useState(false);
  const device: CameraDevice | undefined = useCameraDevice(useFront ? 'front' : 'back');

  // 권한/상태
  const cameraRef = useRef<Camera>(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [permAsked, setPermAsked] = useState(false);

  const [recording, setRecording] = useState(false); // 녹화 세션 존재 여부
  const [isPaused, setIsPaused] = useState(false);   // 일시정지 상태
  const [isStarting, setIsStarting] = useState(false);
  const recordingRef = useRef<any>(null);
  const [lastPath, setLastPath] = useState<string | null>(null);

  // ====== 오디오 (react-native-video로 재생) ======
  const audioRef = useRef<Video>(null);
  const [playAudio, setPlayAudio] = useState(false);  // 재생/일시정지 토글
  const audioPosRef = useRef(0);                      // 현재 위치 저장
  // 필요하면 원격으로 바꿀 수 있음: const audioSource = { uri: 'https://...' };
  const audioSource = require('./assets/audio/song1.mp3'); // 프로젝트 경로에 맞춰 수정

  // 오버레이(우상단 미니 비디오)
  const [overlayOn, setOverlayOn] = useState(false);
  const [overlayUri, setOverlayUri] = useState<string | null>(null);
  const [useBundledOverlay, setUseBundledOverlay] = useState(true);

  // ------ 권한 ------
  const requestPerms = useCallback(async () => {
    try {
      const cam = await Camera.requestCameraPermission();
      const mic = await Camera.requestMicrophonePermission();
      const ok = cam === 'granted' && mic === 'granted';
      setHasPerm(ok);
      setPermAsked(true);
      if (!ok) Alert.alert('권한 필요', '설정에서 카메라/마이크 권한을 허용해주세요.');
    } catch (e) {
      setPermAsked(true);
      Alert.alert('권한 요청 실패', String(e));
    }
  }, []);

  useEffect(() => {
    requestPerms();
  }, [requestPerms]);

  // ------ 갤러리 권한(안드로이드) ------
  async function ensureAndroidGalleryPerm() {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    if (Platform.Version <= 28) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  // ------ 저장 공통 ------
  async function saveUriToGallery(filePath: string) {
    const ok = await ensureAndroidGalleryPerm();
    if (!ok) throw new Error('갤러리 권한이 거부되었습니다.');
    const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    const savedUri = await CameraRoll.save(uri, { type: 'video', album: 'UStar' });
    return savedUri;
  }

  // ===== 내부 유틸: 오디오 제어 (RN-Video) =====
  async function pauseAudioAndRemember() {
    // onProgress에서 계속 갱신되므로 여기선 토글만
    setPlayAudio(false); // 일시정지
  }

  function resumeAudioFromRemembered() {
    // 저장된 위치로 seek 후 재생
    audioRef.current?.seek(audioPosRef.current);
    setPlayAudio(true);
  }

  function resetAudioToZero() {
    audioPosRef.current = 0;
    setPlayAudio(false);
    // 렌더 후 재생 원하면: setTimeout(() => { audioRef.current?.seek(0); setPlayAudio(true); }, 50);
  }

  // ====== 녹화/오디오: 시작 ======
  const startRec = useCallback(async () => {
    if (recording || !cameraRef.current) return;
    if (!hasPerm || !device) {
      Alert.alert('오류', '카메라/마이크 권한 또는 디바이스가 없습니다.');
      return;
    }

    setIsStarting(true);
    setOverlayOn(true);
    setUseBundledOverlay(true);

    // (A) 오디오 먼저 재개
    resumeAudioFromRemembered();

    try {
      await cameraRef.current.startRecording({
        flash: 'off',
        onRecordingFinished: async (v) => {
          setRecording(false);
          setIsPaused(false);
          setOverlayOn(false);
          setLastPath(v.path);
          setPlayAudio(false); // 완료 시 음악도 정지

          try {
            const savedUri = await saveUriToGallery(v.path);
            Alert.alert('녹화 & 저장 완료', savedUri);
          } catch (e: any) {
            Alert.alert('저장 실패', e?.message ?? String(e));
          }
        },
        onRecordingError: (e) => {
          setRecording(false);
          setIsPaused(false);
          setOverlayOn(false);
          setPlayAudio(false);
          Alert.alert('녹화 오류', String(e));
        },
      });

      // Recording 핸들(있으면 저장)
      // @ts-ignore
      recordingRef.current = (cameraRef.current as any)?.recording ?? null;

      setRecording(true);
      setIsPaused(false);

      // (B) 포커스 재탈환: 녹화 시작 직후 200ms 후 다시 재개(기기별 안정화용)
      setTimeout(() => {
        resumeAudioFromRemembered();
      }, 200);

    } catch (e) {
      setRecording(false);
      setIsPaused(false);
      setOverlayOn(false);
      setPlayAudio(false);
      Alert.alert('시작 실패', String(e));
    } finally {
      setIsStarting(false);
    }
  }, [recording, hasPerm, device]);

  // ====== 토글: 시작/일시정지/재개 ======
  const togglePauseResume = useCallback(async () => {
    if (!recording) {
      await startRec();
      return;
    }
    if (!isPaused) {
      // 일시정지
      try {
        await pauseAudioAndRemember();
        await recordingRef.current?.pause?.(); // 지원 버전에서만 동작
        setIsPaused(true);
      } catch (e: any) {
        Alert.alert('일시정지 실패', String(e?.message ?? e));
      }
    } else {
      // 재개
      try {
        resumeAudioFromRemembered();
        await recordingRef.current?.resume?.(); // 지원 버전에서만 동작
        setIsPaused(false);
      } catch (e: any) {
        Alert.alert('재개 실패', String(e?.message ?? e));
      }
    }
  }, [recording, isPaused, startRec]);

  // ====== 완전 정지(저장 콜백 유도) ======
  const stopRec = useCallback(async () => {
    if (!recording) return;
    try {
      await cameraRef.current?.stopRecording();
    } catch (e) {
      setRecording(false);
      setIsPaused(false);
      Alert.alert('정지 실패', String(e));
    } finally {
      setOverlayOn(false);
      setPlayAudio(false);
    }
  }, [recording]);

  // ====== 초기화(처음부터 다시 찍기) ======
  const resetAll = useCallback(async () => {
    try { await cameraRef.current?.stopRecording(); } catch {}
    setRecording(false);
    setIsPaused(false);
    setOverlayOn(false);
    recordingRef.current = null;
    setLastPath(null);
    resetAudioToZero();
    Alert.alert('초기화', '영상/음악이 처음 상태로 초기화됐습니다.');
  }, []);

  // 로딩 상태
  if (!permAsked || !hasPerm || !device) {
    const msg = !permAsked ? '권한 요청 중…' : !hasPerm ? '권한 대기…' : '카메라 준비 중…';
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#666" />
        <Text style={{ marginTop: 8, color:'#ccc' }}>{msg}</Text>
        {permAsked && !hasPerm && (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#334155', marginTop: 16 }]} onPress={requestPerms}>
            <Text style={s.btnTxt}>권한 다시 요청</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {/* 상단: 좌측 = 전면전환 */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.topLeftBtn} onPress={() => setUseFront(v => !v)}>
          <Text style={s.topBtnTxt}>전면전환</Text>
        </TouchableOpacity>
      </View>

      {/* 카메라 프리뷰 */}
      <Camera
        ref={cameraRef}
        style={s.preview}
        device={device}
        isActive
        video
        audio
        onError={(e) => {
          console.log('Camera onError:', e);
          Alert.alert('카메라 오류', String(e));
        }}
      />

      {/* === 숨김 오디오 플레이어 (여기가 핵심) === */}
      <Video
        ref={audioRef}
        source={audioSource}
        paused={!playAudio}
        audioOnly
        repeat
        // iOS 무음스위치 무시 / 백그라운드 재생(플랫폼별 지원)
        ignoreSilentSwitch="ignore"
        playInBackground
        style={{ width: 0, height: 0 }}
        // 진행상태 저장
        onProgress={(p) => { audioPosRef.current = p.currentTime ?? 0; }}
        // 로드되면 저장된 위치로 한번 맞춰줌
        onLoad={() => {
          if (audioPosRef.current > 0) {
            audioRef.current?.seek(audioPosRef.current);
          }
        }}
        // 보이지 않게 0x0로 렌더
        style={{ width: 0, height: 0 }}
      />

      {/* 우상단 미니 비디오 오버레이 */}
      {overlayOn && (
        <View style={s.overlayBox}>
          {useBundledOverlay ? (
            <Video
              source={require('./assets/Videos/video1.mp4')}
              style={s.overlayVideo}
              repeat
              muted
              resizeMode="cover"
               /** 핵심 추가 ↓ */
              disableFocus
              paused={isPaused || !overlayOn}
              /** 충돌 줄이기 */
              useTextureView
              onError={(e)=>console.log('overlay video error', e)}
            />
          ) : overlayUri ? (
            <Video
              source={{ uri: overlayUri }}
              style={s.overlayVideo}
              repeat
              muted
              resizeMode="cover"
              onError={(e)=>console.log('overlay video error', e)}
            />
          ) : null}
          <Text style={s.overlayBadge}>미리보기</Text>
        </View>
      )}

      {/* 하단 컨트롤 */}
      <View style={s.controls}>
        <TouchableOpacity style={[s.btn, { backgroundColor: '#64748b' }]} onPress={resetAll}>
          <Text style={s.btnTxt}>초기화</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.btn,
            { backgroundColor: !recording ? '#ef4444' : isPaused ? '#22c55e' : '#f59e0b' }
          ]}
          onPress={togglePauseResume}
          disabled={isStarting}
        >
          <Text style={s.btnTxt}>
            {!recording ? (isStarting ? '시작중…' : '● 시작') : (isPaused ? '재개' : '일시정지')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.btn, { backgroundColor: recording ? '#111827' : '#374151' }]}
          onPress={stopRec}
          disabled={!recording}
        >
          <Text style={s.btnTxt}>■ 완료</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor:'#000' },
  preview: { flex: 1 },

  topBar: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 30,
  },
  topLeftBtn: {
    position: 'absolute',
    left: 12,
    top: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topBtnTxt: { color: '#fff', fontWeight: '700' },

  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 14, backgroundColor: '#0b1020',
  },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  btnTxt: { color: '#fff', fontWeight: '800', letterSpacing: 1 },

  overlayBox: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    zIndex: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  overlayVideo: { width: '100%', height: '100%' },
  overlayBadge: {
    position: 'absolute',
    left: 6, bottom: 6,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontWeight: '700', fontSize: 10,
  },
});
