import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ImageBackground,
  Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import SoundPlayer from 'react-native-sound-player';

const songs = [
  { id: '1', title: '나는야 장지혜야', file: 'song1' },
  { id: '2', title: '영은아 YOUNG하게 살자', file: 'song3' },
  { id: '3', title: '아프잘 아프지마', file: 'song2' },
  { id: '4', title: '혜미가 아니라 해미라구요', file: 'song4' },
];

const MySongsScreen = ({ navigation }: any) => {
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (file: string, id: string) => {
    try {
      SoundPlayer.playSoundFile(file, 'mp3');
      setSelectedSongId(id);
      setCurrentSong(file);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);

      if (intervalId) clearInterval(intervalId);

      const idInterval = setInterval(async () => {
        try {
          const info = await SoundPlayer.getInfo();
          setCurrentTime(info.currentTime || 0);
          setDuration(info.duration || 0);
        } catch (e) {
          console.log('getInfo 에러:', e);
        }
      }, 500);
      setIntervalId(idInterval);
    } catch (e) {
      console.log('재생 에러:', e);
      Alert.alert('재생 실패', '오디오 파일을 찾을 수 없어요.');
    }
  };

  const handleStop = () => {
    SoundPlayer.stop();
    clearInterval(intervalId);
    setIsPlaying(false);
  };

  const handleSeek = (value: number) => {
    SoundPlayer.seek(value);
    setCurrentTime(value);
  };

  const handlePrev = () => {
    const index = songs.findIndex((s) => s.id === selectedSongId);
    if (index > 0) {
      const prev = songs[index - 1];
      handlePlay(prev.file, prev.id);
    }
  };

  const handleNext = () => {
    const index = songs.findIndex((s) => s.id === selectedSongId);
    if (index < songs.length - 1) {
      const next = songs[index + 1];
      handlePlay(next.file, next.id);
    }
  };

  const renderItem = ({ item }: { item: (typeof songs)[0] }) => (
    <View
      style={[styles.songItem, selectedSongId === item.id && styles.selectedItem]}
    >
      <Text style={styles.songTitle}>{item.title}</Text>
      <TouchableOpacity
        onPress={() => handlePlay(item.file, item.id)}
        style={styles.playButton}
      >
        <Image
          source={require("../../../src/assets/icon/Play.png")}
          style={styles.playIcon}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <ImageBackground
      source={require("../../../src/assets/background/background.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.songList}
        />

        {currentSong && (
          <Slider
            value={currentTime}
            minimumValue={0}
            maximumValue={duration}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#A1D6FF"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#FFCFD2"
            style={styles.progressBar}
          />
        )}

        {selectedSongId && (
          <View style={styles.bottomControlRow}>
            <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
              <Image source={require("../../../src/assets/icon/left.png")} style={styles.navIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const song = songs.find((s) => s.id === selectedSongId);
                if (song) {
                  isPlaying ? handleStop() : handlePlay(song.file, song.id);
                }
              }}
              style={styles.navButton}
            >
              <Image
                source={isPlaying ? require("../../../src/assets/icon/Pause.png") : require("../../../src/assets/icon/Play.png")}
                style={styles.navIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} style={styles.navButton}>
              <Image source={require("../../../src/assets/icon/right.png")} style={styles.navIcon} />
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate('SongPlay', { songId: selectedSongId })}
                style={styles.navButton}
              >
                <Image source={require("../../../src/assets/icon/SongMenu.png")} style={styles.navIcon} />
              </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

export default MySongsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  songItem: {
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderColor: '#95ABE4',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 16,
  },
  playButton: {
    padding: 6,
  },
  playIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  songList: {
    marginTop: 40,
  },
  selectedItem: {
    backgroundColor: '#ffffff33',
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  progressBar: {
    marginTop: 50,
    marginHorizontal: 20,
  },
  bottomControlRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  navButton: {
    padding: 10,
  },
  navIcon: {
    width: 48,   // 기존보다 키움
    height: 48,  // 기존보다 키움
    resizeMode: 'contain',
  },
});
