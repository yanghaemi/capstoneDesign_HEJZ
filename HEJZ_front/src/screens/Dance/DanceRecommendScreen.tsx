// 안무 추천 페이지
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, ImageBackground } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ApiContext } from '../../context/ApiContext';
import SoundPlayer from 'react-native-sound-player';
import Slider from '@react-native-community/slider';

const DanceRecommendScreen=({ route, navigation }) =>{
    const { p_id, p_title, p_filepath } = route.params; // props 받는 코드

  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [intervalId, setIntervalId] = useState<any>(null);
    const [id, setId] = useState(p_id);
    const [title, setTitle] = useState(p_title);
    const [filepath, setFilepath] = useState(p_filepath);
    console.log(title);
    console.log(id);
    console.log(filepath);

    const handlePlay = async (file: string) => {
        try {
          SoundPlayer.playSoundFile(file, 'mp3');
          setCurrentSong(file);
          setCurrentTime(0);
          setDuration(0);

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
          setIntervalId(id);
        } catch (e) {
          Alert.alert('재생 실패', '오디오 파일을 찾을 수 없어요.');
          console.log('재생 에러:', e);
        }
      };

      const handleStop = () => {
          try {
            SoundPlayer.stop();
            clearInterval(intervalId);
            setCurrentSong(null);
            setCurrentTime(0);
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
      source={require('../../assets/mainbackground.png')}
      style={styles.background}
      resizeMode="cover"
      >
            <Text style={styles.header}> {title} </Text>
            <View style={styles.nowPlaying}>
                  <Text style={styles.nowPlayingText}>
                    ⏱ 재생 중: {title}
                  </Text>

                  <Slider
                    value={currentTime}
                    minimumValue={0}
                    maximumValue={duration}
                    onSlidingComplete={handleSeek}
                    minimumTrackTintColor="#4B9DFE"
                    maximumTrackTintColor="#ddd"
                    thumbTintColor="#4B9DFE"
                    style={{ marginTop: 8 }}
                  />
                  <Text style={styles.timeText}>
                              {Math.floor(currentTime)} / {Math.floor(duration)} 초
                    </Text>

                    <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
                      <Text style={styles.stopText}>⏹ 정지</Text>
                    </TouchableOpacity>
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
    backgroundColor: '#fff',
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
  prompt: {
    fontSize: 14,
    color: '#555',
  },
  result: {
    marginTop: 30,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
  songItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: '#ddd',
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
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
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
    fontSize: 16,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  stopButton: {
    backgroundColor: '#FE4B4B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  stopText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});