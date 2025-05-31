import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import SoundPlayer from 'react-native-sound-player';

const songs = [
  { id: '1', title: '나는야 장지혜야', file: 'song1' },
  { id: '2', title: '영은아 YOUNG하게 살자', file: 'song2' },
  { id: '3', title: '혜미가 아니라 해미라구요', file: 'song3' },
];

const MySongsScreen = () => {
  const [currentSong, setCurrentSong] = useState<string | null>(null);

  const handlePlay = (file: string) => {
    try {
      SoundPlayer.playSoundFile(file, 'mp3');
      setCurrentSong(file);
    } catch (e) {
      Alert.alert('재생 실패', '오디오 파일을 찾을 수 없어요.');
      console.log('재생 에러:', e);
    }
  };

  const handleStop = () => {
    try {
      SoundPlayer.stop();
      setCurrentSong(null);
    } catch (e) {
      console.log('정지 에러:', e);
    }
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
    marginBottom: 8,
  },
  stopButton: {
    backgroundColor: '#FE4B4B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stopText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
