// 안무 추천 페이지
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, Button, ImageBackground, Alert } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import axios from 'axios';
import { useApi } from "../../context/ApiContext";
import { createStackNavigator } from "@react-navigation/stack";
import SoundPlayer from 'react-native-sound-player';
import Slider from '@react-native-community/slider';
import songTitleMap from '../../assets/Document/SongTitleName.json';
import lyricsData from '../../assets/Document/Lyrics.json';
import Video from 'react-native-video';

const DanceRecommendScreen=({ route, navigation }) =>{
    const { p_id, p_title, p_filepath } = route.params; // props 받는 코드
    const { apiUrl, apiKey } = useApi();

    const [currentSong, setCurrentSong] = useState<string | null>(null);
    const [currentLyric, setCurrentLyric] = useState('');

    const [rawLyrics, setRawLyrics] = useState<any[]>([]); // api로 받은 raw 가사

    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [id, setId] = useState(p_id);
    const [title, setTitle] = useState(p_title);
    const [filepath, setFilepath] = useState(p_filepath);

    const groupedLyrics = useMemo(() => {
      const lines = [];
      for (let i = 0; i < rawLyrics.length; i += 2) {
        const lineGroup = rawLyrics.slice(i, i + 2);
        lines.push(lineGroup);
      }
      return lines;
    }, [rawLyrics]);

     const resetCurrentTime = async () =>{
      setCurrentTime(0);
    };

     const loadSongs = async () => {
          SoundPlayer.playSoundFile('song1', 'mp3');
     };

//     const startLyricInterval = (lyricsList, currentLyric, setCurrentLyric) => {
//       return setInterval(async () => {
//         try {
//                 const info = await SoundPlayer.getInfo();
//                 const time = info.currentTime;
//
//                 const currentLine = lyricsList.find((line, i) => {
//                   const next = lyricsList[i + 1];
//                   return time >= line.time && (!next || time < next.time);
//                 });
//
//                 if (currentLine?.text !== currentLyric) {
//                   setCurrentLyric(currentLine?.text || '');
//                 }
//               } catch (e) {
//                 console.log('getInfo 실패:', e);
//               }
//       }, 400);
//     };

    const getLyrics = async() => {
         try {
            const response = await axios.get(`${apiUrl}/api/song/getlyrics`,{
                params: { taskid: id },
            });
            console.log('response: ', response.data.data);


            // 문자열 → 객체로 파싱
            const alignedWords = response.data.data; // 필요한 배열 추출

            setRawLyrics(alignedWords);
            console.log('가사', rawLyrics);
         } catch(error){
            console.error('가사 불러오기 실패:', error);
            console.log('가사', rawLyrics);
         }

    };


    useEffect(() => {

        getLyrics();
//         const interval = setInterval(async () => {
//           try {
//             const info = await SoundPlayer.getInfo();
//             setCurrentTime(info.currentTime);
//           } catch (e) {
//             console.log('getInfo 실패:', e);
//           }
//         }, 300);
//
//         return () => clearInterval(interval);
      },[]);

//      useEffect(() => {
//         //resetCurrentTime();     // 현재 시간과 duration 초기화
// //         loadSongs();
//          //const interval = startLyricInterval(lyricsList, currentLyric, setCurrentLyric);
//          //return () => clearInterval(interval);
//
//       }, [lyricsList, currentLyric]);



    const handlePlay = () => {
        try {
            // 먼저 기존 인터벌 정리
            if (intervalRef.current) clearInterval(intervalRef.current);

            // 1. 재생 시작
            SoundPlayer.playSoundFile('song1', 'mp3');

            // 2. 약간 딜레이 주고 원하는 위치로 이동
            setTimeout(() => {
              SoundPlayer.seek(currentTime);  // ⏪ 현재 시간부터 시작
            }, 300); // 300~500ms 정도가 안정적

          // 재생 추적 인터벌
          const id = setInterval(async () => {
            try {
              const info = await SoundPlayer.getInfo();
              setCurrentTime(info.currentTime || 0);
              setDuration(info.duration || 0);
            } catch (e) {
              console.log('getInfo 에러:', e);
            }
          }, 500);
        intervalRef.current = id;
        } catch (e) {
          Alert.alert('재생 실패', '오디오 파일을 찾을 수 없어요.');
          console.error('로컬 재생 실패:', e);
        }
      };

      const handleStop = () => {
          try {
            SoundPlayer.stop();
            clearInterval(intervalId);
//             setCurrentTime(0);
            setDuration(0);
          } catch (e) {
            console.log('정지 에러:', e);
          }
        };

    const handleSeek = (value: number) => {
      SoundPlayer.seek(value);
      setCurrentTime(value);
    };



    return (
    <ImageBackground
      source={require('../../assets//background/mainbackground.png')}
      style={styles.background}
      resizeMode="cover"
      >

        <View style={styles.playerCard}>
          <Text style={styles.nowPlayingText}>⏱ 재생 중: {title}</Text>

          <View style={styles.controls}>
            <TouchableOpacity onPress={handleStop} style={[styles.controlButton, styles.stopButton]}>
              <Text style={styles.controlText}>⏸️</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={()=>{
                    handlePlay();
                    console.log("노래 재생");
                }}
                style={[styles.controlButton, styles.playButton]}>
              <Text style={styles.controlText}>▶️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetCurrentTime} style={[styles.controlButton, styles.resetButton]}>
              <Text style={styles.controlText}>⏹️</Text>
            </TouchableOpacity>
          </View>


          <Slider
            value={currentTime}
            minimumValue={0}
            maximumValue={duration}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#4B9DFE"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#4B9DFE"
            style={styles.slider}
          />

          <Text style={styles.timeText}>
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} /
            {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')} 초
          </Text>
        </View>
        <View style={styles.container}>
            <View style={styles.lyricsBox}>
              {groupedLyrics.map((lineGroup, lineIndex) => {
                // 이 줄 묶음의 시간 범위 계산
                const groupStart = lineGroup[0]?.startS ?? 0;
                const groupEnd = lineGroup[lineGroup.length - 1]?.endS ?? 0;

                // 현재 시간이 이 그룹의 범위 안이면 표시
                const isCurrentGroup = currentTime >= groupStart && currentTime <= groupEnd;

                if (!isCurrentGroup) return null;

                return (
                  <View key={lineIndex} style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                    {lineGroup.map((wordObj, wordIndex) => {
                      const isActive = currentTime >= wordObj.startS && currentTime < wordObj.endS;
                      return (
                        <Text
                          key={wordIndex}
                          style={[styles.word, isActive && styles.activeWord]}
                        >
                          {wordObj.word}
                        </Text>
                      );
                    })}
                  </View>
                );
              })}
            </View>
        </View>

    </ImageBackground>


    );
};

export default DanceRecommendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 0,
    paddingHorizontal: 24,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    marginBottom: 20,
  },
  item: {
    padding: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#cde1ff',
  },
  title: {
    fontSize: 16,
    marginRight: 10,
    flexShrink: 1
  },
  playerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginVertical: 20,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  result: {
    marginTop: 30,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
    songTitle: {
      fontSize: 16,
    },
  background: {
         flex: 1,
        resizeMode: 'cover',
  },
  playButton: {
    backgroundColor: '#4B9DFE',
  },
  resetButton: {
    backgroundColor: '#81C147',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
    playText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    nowPlaying: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: '#f2f2f2',
      borderRadius: 8,
    },
   nowPlayingText: {
     fontSize: 18,
     fontWeight: 'bold',
     marginBottom: 12,
     color: '#333',
   },
   slider: {
     width: '100%',
     height: 40,
     marginBottom: 10,
   },
      timeText: {
        fontSize: 13,
        color: '#666',
      },
      stopButton: {
        backgroundColor: '#FE4B4B',
      },
      controlButton: {
        width: 40,
            height: 30,
            borderRadius: 6,
            justifyContent: 'center',
            alignItems: 'center'
      },
      stopText: {
        color: '#fff',
        fontWeight: 'bold',
      },
      lyricsBox: {
          flexWrap: 'wrap',
          flexDirection: 'row',
          flexShrink: 1,
          fontSize: 20,
          color: 'white',
    },
    lyricsText: {
        fontSize: 20,
        lineHeight: 34,
        color: '#333',
        fontWeight: '500',
        textAlign: 'center',
      },

      word: {
          color: 'gray',
        },
        activeWord: {
          color: 'yellow', // 현재 재생 중인 단어 강조!
          fontWeight: 'bold',
        },
});