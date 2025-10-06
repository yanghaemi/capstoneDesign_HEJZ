// src/screens/TestScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

export default function TestScreen() {
  const devices = useCameraDevices();
  const [useFront, setUseFront] = useState(false);
  const device = useFront ? devices.front : devices.back;

  const cameraRef = useRef<Camera>(null);
  const [hasPerm, setHasPerm] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);

  // 권한 요청
  useEffect(() => {
    (async () => {
      const cam = await Camera.requestCameraPermission();
      const mic = await Camera.requestMicrophonePermission();
      const ok = cam === 'granted' && mic === 'granted';
      setHasPerm(ok);
      if (!ok) Alert.alert('권한 필요', '설정에서 카메라/마이크 권한을 허용해주세요.');
    })();
  }, []);

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
    try { await cameraRef.current?.stopRecording(); }
    catch (e) {
      setRecording(false);
      Alert.alert('정지 실패', String(e));
    }
  }, [recording]);

  if (!device || !hasPerm) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#666" />
        <Text style={{ marginTop: 8, color:'#ccc' }}>
          {hasPerm ? '카메라 준비 중…' : '권한 대기…'}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {/* 카메라 프리뷰 */}
      <Camera
        ref={cameraRef}
        style={s.preview}
        device={device}
        isActive
        video
        audio
      />

      {/* 하단 컨트롤 */}
      <View style={s.controls}>
        <TouchableOpacity style={[s.btn, { backgroundColor: '#334155' }]} onPress={() => setUseFront(v => !v)}>
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
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor:'#000' },
  preview: { flex: 1 },
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 14, backgroundColor: '#0b1020',
  },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  btnTxt: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
});
