// src/screens/TestScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevice, type CameraDevice } from 'react-native-vision-camera';

export default function TestScreen() {
  // 1) useFront를 먼저 선언
  const [useFront, setUseFront] = useState(false);

  // 2) 단일 훅으로 디바이스 선택
  const device: CameraDevice | undefined = useCameraDevice(useFront ? 'front' : 'back');

  // 권한/상태
  const cameraRef = useRef<Camera>(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [permAsked, setPermAsked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);

  // 권한 요청
  const requestPerms = useCallback(async () => {
    try {
      const cam = await Camera.requestCameraPermission();
      const mic = await Camera.requestMicrophonePermission();
      const ok = cam === 'granted' && mic === 'granted';
      setHasPerm(ok);
      setPermAsked(true);
      if (!ok) {
        Alert.alert('권한 필요', '설정에서 카메라/마이크 권한을 허용해주세요.');
      }
    } catch (e) {
      setPermAsked(true);
      Alert.alert('권한 요청 실패', String(e));
    }
  }, []);

  useEffect(() => {
    requestPerms();
  }, [requestPerms]);

  // 실제 장치 목록 로그 (디버깅용)
  useEffect(() => {
    (async () => {
      try {
        const list = await Camera.getAvailableCameraDevices();
        console.log('Available devices:', list);
      } catch (e) {
        console.log('getAvailableCameraDevices error:', e);
      }
    })();
  }, []);

  // 녹화
  const startRec = useCallback(async () => {
    if (recording || !cameraRef.current) return;
    try {
      setRecording(true);
      await cameraRef.current.startRecording({
        flash: 'off',
        onRecordingFinished: v => {
          setRecording(false);
          setLastPath(v.path);
          Alert.alert('녹화 완료', v.path);
        },
        onRecordingError: e => {
          setRecording(false);
          Alert.alert('녹화 오류', String(e));
        },
      });
    } catch (e) {
      setRecording(false);
      Alert.alert('시작 실패', String(e));
    }
  }, [recording]);

  const stopRec = useCallback(async () => {
    if (!recording) return;
    try {
      await cameraRef.current?.stopRecording();
    } catch (e) {
      setRecording(false);
      Alert.alert('정지 실패', String(e));
    }
  }, [recording]);

  // 로딩 상태
  if (!permAsked || !hasPerm || !device) {
    const msg = !permAsked ? '권한 요청 중…' : !hasPerm ? '권한 대기…' : '카메라 준비 중…';
    return (
      <View style={s.center}>
        <View style={s.debugWrap}>
          <Text style={s.debugTxt}>
            perm:{String(hasPerm)} | useFront:{String(useFront)} | device:{device ? device.position : 'none'}
          </Text>
        </View>

        <ActivityIndicator size="large" color="#666" />
        <Text style={{ marginTop: 8, color: '#ccc' }}>{msg}</Text>

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
      {/* 상단 디버그 */}
      <View style={s.debugWrap}>
        <Text style={s.debugTxt}>
          perm:{String(hasPerm)} | device:{device?.position}/{device?.id}
        </Text>
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

      {/* 하단 컨트롤 */}
      <View style={s.controls}>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#334155' }]}
          onPress={() => setUseFront(v => !v)}
        >
          <Text style={s.btnTxt}>{useFront ? '후면' : '전면'}</Text>
        </TouchableOpacity>

        {!recording ? (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#ef4444' }]} onPress={startRec}>
            <Text style={s.btnTxt}>● REC</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btn, { backgroundColor: '#111827' }]} onPress={stopRec}>
            <Text style={s.btnTxt}>■ STOP</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[s.btn, { backgroundColor: lastPath ? '#f59e0b' : '#475569' }]}
          onPress={() => lastPath && Alert.alert('마지막 파일', lastPath)}
          disabled={!lastPath}
        >
          <Text style={s.btnTxt}>최근경로</Text>
        </TouchableOpacity>

        {/* PROBE 버튼 (선택) */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#334155', position:'absolute', top:60, right:10 }]}
          onPress={async () => {
            const permCam = await Camera.getCameraPermissionStatus();
            const permMic = await Camera.getMicrophonePermissionStatus();
            const list = await Camera.getAvailableCameraDevices();
            Alert.alert('probe', JSON.stringify({ permCam, permMic, devices: list.length }));
          }}
        >
          <Text style={s.btnTxt}>PROBE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  preview: { flex: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: '#0b1020',
  },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  btnTxt: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  debugWrap: { position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10 },
  debugTxt: { color: '#0f0', fontSize: 12 },
});
