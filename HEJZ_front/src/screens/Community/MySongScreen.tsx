import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';
import Slider from '@react-native-community/slider';

const songs = [
  { id: '1', title: '나는야 장지혜야', file: 'song1' },
  { id: '2', title: '영은아 YOUNG하게 살자', file: 'song3' },
  { id: '3', title: '아프잘 아프지마', file: 'song2' },
  { id: '4', title: '혜미가 아니라 해미라구요', file: 'song4' },
];

const MySongsScreen = () => {
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [intervalId, setIntervalId] = useState<any>(null);

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

  const renderItem = ({ item }: { item: (typeof songs)[0] }) => (
    <View style={styles.songItem}>
      <Text style={styles.songTitle}>{item.title}</Text>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => handlePlay(item.file)}
      >
        <Text style={styles.playText}>▶ 재생</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>노래 목록</Text>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ marginBottom: 20 }}
      />

      {currentSong && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingText}>
            ⏱ 재생 중: {songs.find((s) => s.file === currentSong)?.title}
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
      )}
    </View>
  );
};

export default MySongsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
