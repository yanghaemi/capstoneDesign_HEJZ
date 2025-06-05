import React, { useState, useEffect, useRef } from 'react';
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
import RNFS from 'react-native-fs';
import songTitleMap from '../../assets/Document/SongTitleName.json';

interface Song {
  id: string;
  title: string;
  file: string;
}

const MySongsScreen = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const dir = `${RNFS.DocumentDirectoryPath}/songs`;
        const files = await RNFS.readDir(dir);
        const mp3Files = files.filter(f => f.name.endsWith('.mp3'));

        const songList = mp3Files.map((f, i) => {
          const baseName = f.name.replace('.mp3', '');
          const title = songTitleMap[baseName] || baseName;
          return {
            id: `${i}`,
            title,
            file: f.path,
          };
        });

        setSongs(songList);
      } catch (e) {
        Alert.alert('오류', '노래를 불러오는 중 문제가 발생했어요.');
      }
    };

    loadSongs();
  }, []);

  const handlePlay = async (song: Song) => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      SoundPlayer.playUrl(`file://${song.file}`);
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(0);

      const interval = setInterval(() => {
        SoundPlayer.getInfo()
          .then(info => {
            setCurrentTime(info.currentTime || 0);
            setDuration(info.duration || 0);
          })
          .catch(err => {
            console.log('getInfo 오류:', err);
          });
      }, 500);

      intervalRef.current = interval;
    } catch (e) {
      Alert.alert('재생 실패', '오디오 파일을 재생할 수 없어요.');
      console.log('재생 에러:', e);
    }
  };

  const handleStop = () => {
    try {
      SoundPlayer.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentSong(null);
      setCurrentTime(0);
      setDuration(0);
    } catch (e) {
      console.log('정지 에러:', e);
    }
  };

  const handleSeek = (value: number) => {
    try {
      SoundPlayer.seek(value);
      setCurrentTime(value);
    } catch (e) {
      console.log('seek 에러:', e);
    }
  };

  const renderItem = ({ item }: { item: Song }) => (
    <View style={styles.songItem}>
      <Text style={styles.songTitle}>{item.title}</Text>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => handlePlay(item)}
      >
        <Text style={styles.playText}>재생</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>나의 음악들</Text>

      <FlatList
        data={songs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        style={{ marginBottom: 20 }}
      />

      {currentSong && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingText}>
            🎶 {currentSong.title}
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
              {Math.floor((Math.floor(currentTime)/60))}:{Math.floor(currentTime)%60} / {Math.floor((Math.floor(duration)/60))}:{Math.floor(duration)%60} 초
          </Text>

          <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
            <Text style={styles.stopText}>정지</Text>
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
