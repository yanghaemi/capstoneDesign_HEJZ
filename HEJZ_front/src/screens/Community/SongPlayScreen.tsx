import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import lyricsData from '../../../src/assets/Document/Lyrics.json';
import SoundPlayer from 'react-native-sound-player';

const songs = [
  { id: '1', title: '나는야 장지혜야', file: 'song1' },
  { id: '2', title: '영은아 YOUNG하게 살자', file: 'song3' },
  { id: '3', title: '아프잘 아프지마', file: 'song2' },
  { id: '4', title: '혜미가 아니라 해미라구요', file: 'song4' },
];

const SongPlayScreen = () => {
  const route = useRoute<any>();
  const { songId } = route.params;

  const [currentId, setCurrentId] = useState(songId);
  const [isPlaying, setIsPlaying] = useState(false);
//   console.log('songId:', songId);
//   console.log('currentId:', currentId);
//   console.log('lyricsData:', lyricsData);
  const lyrics = useMemo(() => {
    return lyricsData[String(currentId)]?.lyrics || '가사를 찾을 수 없습니다.';
  }, [currentId]);

  const handlePlay = (file: string) => {
    try {
      SoundPlayer.playSoundFile(file, 'mp3');
      setIsPlaying(true);
    } catch (e) {
      console.log('재생 오류:', e);
    }
  };

  const handleStop = () => {
    try {
      SoundPlayer.stop();
      setIsPlaying(false);
    } catch (e) {
      console.log('정지 오류:', e);
    }
  };

  const handlePrev = () => {
    const index = songs.findIndex((s) => s.id === currentId);
    if (index > 0) {
      const prev = songs[index - 1];
      setCurrentId(prev.id);
      handlePlay(prev.file);
    }
  };

  const handleNext = () => {
    const index = songs.findIndex((s) => s.id === currentId);
    if (index < songs.length - 1) {
      const next = songs[index + 1];
      setCurrentId(next.id);
      handlePlay(next.file);
    }
  };

  useEffect(() => {
    const song = songs.find((s) => s.id === currentId);
    if (song) {
      handlePlay(song.file);
    }

    return () => {
      handleStop();
    };
  }, [currentId]);

  return (
    <ImageBackground
      source={require("../../../src/assets/background/SongBackgroud.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.lyricsBox}>
          <ScrollView>
            <Text style={styles.lyricsText}>{lyrics}</Text>
          </ScrollView>
        </View>

        <View style={styles.bottomControlRow}>
          <TouchableOpacity onPress={handlePrev} style={styles.navButton}>
            <Image source={require("../../../src/assets/icon/left.png")} style={styles.navIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const song = songs.find((s) => s.id === currentId);
              if (song) {
                isPlaying ? handleStop() : handlePlay(song.file);
              }
            }}
            style={styles.navButton}
          >
            <Image
              source={
                isPlaying
                  ? require("../../../src/assets/icon/Pause.png")
                  : require("../../../src/assets/icon/Play.png")
              }
              style={styles.navIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.navButton}>
            <Image source={require("../../../src/assets/icon/right.png")} style={styles.navIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default SongPlayScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  lyricsBox: {
    flex: 1,
    backgroundColor: '#ffffffaa',
    borderRadius: 12,
    padding: 24,
    marginBottom: 40,
    marginTop: 90,
  },
  lyricsText: {
    fontSize: 20,
    lineHeight: 34,
    color: '#333',
    fontWeight: '500',
  },
  bottomControlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
  },
  navIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
});
