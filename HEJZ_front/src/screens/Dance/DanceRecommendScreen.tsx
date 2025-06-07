// 안무 추천 페이지
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, ImageBackground, Alert } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ApiContext } from '../../context/ApiContext';
import SoundPlayer from 'react-native-sound-player';
import Slider from '@react-native-community/slider';
// import RNFS from 'react-native-fs';
import songTitleMap from '../../assets/Document/SongTitleName.json';
import Video from 'react-native-video';

const DanceRecommendScreen=({ route, navigation }) =>{
    const { p_id, p_title, p_filepath } = route.params; // props 받는 코드

    const [currentSong, setCurrentSong] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [id, setId] = useState(p_id);
    const [title, setTitle] = useState(p_title);
    const [filepath, setFilepath] = useState(p_filepath);
    console.log(title);
    console.log(id);
    console.log(filepath);

     const resetCurrentTime = async () =>{
              setCurrentTime(0);
              setDuration(0);
            };

     const loadSongs = async () => {
          SoundPlayer.playSoundFile('song1', 'mp3');
     };

     useEffect(() => {
        resetCurrentTime();     // 현재 시간과 duration 초기화
//         loadSongs();
      }, []);

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
      <Video
          source={{ uri: fileUrl }}
          style={styles.video}
          controls={true}
          resizeMode="contain"
          paused={false}
        />
        <View style={styles.playerCard}>
          <Text style={styles.nowPlayingText}>⏱ 재생 중: {title}</Text>

          <View style={styles.controls}>
            <TouchableOpacity onPress={handleStop} style={[styles.controlButton, styles.stopButton]}>
              <Text style={styles.controlText}>⏸️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlay} style={[styles.controlButton, styles.playButton]}>
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
    </ImageBackground>


    );
};

export default DanceRecommendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
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
    fontWeight: '600',
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
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      },
      stopText: {
        color: '#fff',
        fontWeight: 'bold',
      },
});