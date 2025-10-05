import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Linking } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

const RecordScreen = () => {
  const cameraRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const device = useCameraDevice('back'); // 후면 카메라 사용

  // 권한 요청
  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();

    if (cameraPermission !== 'granted' || microphonePermission !== 'granted') {
      Alert.alert(
        '권한 필요',
        '카메라와 마이크 권한이 필요합니다. 설정에서 허용해주세요.',
        [{ text: '설정으로 이동', onPress: () => Linking.openSettings() }],
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  // 카메라가 없거나 권한이 없는 경우
  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>카메라를 사용할 수 없습니다.</Text>
      </View>
    );
  }

  const handleRecord = async () => {
    if (isRecording) {
      // 녹화 중지
      await cameraRef.current?.stopRecording();
      setIsRecording(false);
    } else {
      // 녹화 시작
      try {
        cameraRef.current?.startRecording({
          onRecordingFinished: async (video) => {
            try {
              await CameraRoll.save(`file://${video.path}`, { type: 'video' });
              Alert.alert('녹화 완료', `파일 저장 위치:\n${video.path}`);
              console.log('🎥 저장된 비디오:', video.path);
            } catch (e) {
              Alert.alert('에러', '비디오 저장 중 오류 발생');
              console.error(e);
            }
            setIsRecording(false);
          },
          onRecordingError: (error) => {
            Alert.alert('에러', '녹화 중 오류 발생');
            console.error(error);
            setIsRecording(false);
          },
        });
        setIsRecording(true);
      } catch (e) {
        Alert.alert('에러', '녹화 시작 중 오류 발생');
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        zoom={device.neutralZoom} // 기본 줌 설정
        enableZoomGesture={true} // 줌 제스처 활성화
        videoStabilizationMode="auto" // 안정화 자동
      />
      <TouchableOpacity style={styles.button} onPress={handleRecord}>
        <Text style={styles.buttonText}>
          {isRecording ? '🛑 정지' : '🔴 녹화'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#ff3333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: 'white', fontSize: 18, textAlign: 'center', marginTop: 50 },
});

export default RecordScreen;