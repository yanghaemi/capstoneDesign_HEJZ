// SunoPreviewScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import SoundPlayer from 'react-native-sound-player';
import { RouteProp } from '@react-navigation/native';

// interface Props {
//   route: RouteProp<{ params: { title: string; audioUrl: string } }, 'params'>;
// }

const SunoPreviewScreen = () => {
//   const { title, audioUrl } = route.params;
  const [title, setTitle] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('https://9f1c-115-20-243-238.ngrok-free.app');
  const [prompt, setPrompt] = useState('');
  const [sourceAudioUrl, setSourceAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [audioId, setAudioId] = useState('');
  const [lyrics, setLyrics] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [parseLyrics, setParseLyrics] = useState('');

  const [isLoading, setIsLoading] = useState(false);



     const generateSong = async () => {
        try {
          const response = await axios.post(`${callbackUrl}/api/suno/generate`, {
            prompt: prompt,
            style: '',
            title: '',
            customMode: false,
            instrumental: false,
            model: 'V3_5',
            callBackUrl: callBackUrl+'/api/suno/callback',
          });
          console.log('✅ 생성 요청 성공:', response.data);
          Alert.alert('요청 성공', '서버에서 곡 생성 요청을 성공적으로 보냈어요.');
        } catch (error) {
          console.error('🚫 요청 실패:', error);
          Alert.alert('요청 실패', '곡 생성 요청 중 오류가 발생했어요.');
        }
      };

      const fetchSavedSongs = async () => {
          try {
            const res = await axios.get(`${callbackUrl}/api/suno/latest`);
            const song = res.data[0];
            setTitle(song.title);
            setSourceAudioUrl(song.sourceAudioUrl);
            setTaskId(song.taskId);
            setAudioId(song.audioId);
            setLyrics(song.prompt);

            console.log(song);
            console.log(title);
            console.log(lyrics);
            console.log(sourceAudioUrl);

            lyricsAnalyze();

//             Alert.alert('불러오기 완료', '🎵 '+song.title+' 를 재생할 수 있어요!');
          } catch (err) {
            console.error('곡 목록 불러오기 실패:', err);
          }
        };

      const lyricsAnalyze = async () => {
        try {
          const cleanedLyrics = stripSectionHeaders(lyrics);
          const parsedLyrics = cleanedLyrics.replace(/\n/g, "\\n");
          setParseLyrics(parsedLyrics); // 필요하면 화면에 띄우기용

          console.log('🔹 파싱된 가사:\n',parsedLyrics);

          const res = await axios.post(`http://10.0.2.2:8080/api/emotion/analyze`, {
            lyrics: parsedLyrics,
          });

          console.log('🔸 분석 결과:', res.data);
        } catch (err) {
          console.error('가사 분석 실패: ', err);
        }
      };

      function stripSectionHeaders(lyrics: string): string {
        return lyrics
          .split('\n')
          .filter(line => !line.trim().startsWith('[')) // 헤더([Chorus]) 제거
          .filter(line => line.trim() !== '')           // 빈 줄 제거
          .join('\n');                                  // 줄바꿈 유지
      }

//       useEffect(() => {
//          lyricsAnalyze(); // 가사 분석 요청 api
//          }, [lyrics]);

  const playSong = () => {
    setIsLoading(true); // 🎧 로딩 시작
    try {
      SoundPlayer.playUrl(sourceAudioUrl);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        try {
          const info = await SoundPlayer.getInfo();
          setCurrentTime(info.currentTime || 0);
          setDuration(info.duration || 0);

          // ✅ 재생 중인 상태라면 로딩 끝내기 (한 번만)
          if (isLoading && info.currentTime > 0) {
            setIsLoading(false);
          }
        } catch (e) {
          console.log('getInfo error', e);
        }
      }, 500);
    } catch (e) {
      Alert.alert('재생 실패', '오디오 URL에 접근할 수 없습니다.');
    }
  };

  const stopSong = () => {
    try {
      SoundPlayer.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    } catch (e) {
      console.log('정지 실패', e);
    }
  };

  const handleSeek = (value: number) => {
    SoundPlayer.seek(value);
    setCurrentTime(value);
  };


  useEffect(() => {
     fetchSavedSongs();
   }, []);

  return (
    <ScrollView style={styles.container}>
          <Text style={styles.header}>🎵 {title || '생성된 곡이 없습니다.'}</Text>

          <TextInput
            style={styles.input}
            placeholder="프롬프트 입력"
            value={prompt}
            onChangeText={setPrompt}
          />

          <TextInput
            style={styles.input}
            placeholder="콜백 URL 입력"
            value={callbackUrl}
            onChangeText={setCallbackUrl}
          />

          <TouchableOpacity onPress={generateSong} style={[styles.button, styles.generate]}>
            <Text style={styles.buttonText}>🎶 곡 생성하기</Text>
          </TouchableOpacity>

          <View style={styles.controls}>
            <TouchableOpacity onPress={playSong} style={[styles.button, styles.play]}>
              <Text style={styles.buttonText}>▶️ 재생</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopSong} style={[styles.button, styles.stop]}>
              <Text style={styles.buttonText}>⏹ 정지</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchSavedSongs} style={[styles.button, styles.stop]}>
              <Text style={styles.buttonText}>⏹ 페치</Text>
            </TouchableOpacity>
          </View>

          <Slider
            value={currentTime}
            minimumValue={0}
            maximumValue={duration}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#4B9DFE"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#4B9DFE"
            style={{ marginTop: 16 }}
          />
          <Text style={styles.time}>
            {Math.floor(currentTime)} / {Math.floor(duration)} 초
          </Text>

          {isLoading && (
                    <Text style={{ textAlign: 'center', marginBottom: 10, color: 'gray' }}>
                      🎶 재생 준비 중...
                    </Text>
                  )}
        </ScrollView>
  );
};

export default SunoPreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: '#fdfdfd',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  play: {
    backgroundColor: '#4B9DFE',
  },
  stop: {
    backgroundColor: '#FE4B4B',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  time: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 12,
  },
});
