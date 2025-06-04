// screens/DanceScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  ImageBackground,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import songTitleMap from '../../assets/Document/SongTitleName.json';

interface Song {
  id: string;
  title: string;
  file: string;
}

const DanceScreen = ({ navigation }: any) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

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

  const handleRecommend = () => {
    if (!selectedSongId) return;

    const selected = songs.find(s => s.id === selectedSongId);
    if (!selected) return;

    navigation.navigate('DanceRecommendScreen', {
      song: selected, // 필요하다면 추천받은 곡 정보도 넘김
    });
  };

  const renderItem = ({ item }: { item: Song }) => (
    <TouchableOpacity
      style={[
        styles.item,
        item.id === selectedSongId && styles.selectedItem,
      ]}
      onPress={() => setSelectedSongId(item.id)}
    >
      <Text style={styles.title}>{item.title}</Text>

    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../../assets/mainbackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.header}>노래를 선택해주세요</Text>

        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />

        <Button
          title="안무 추천받기"
          onPress={handleRecommend}
          disabled={!selectedSongId}
        />

        {recommendation && (
          <Text style={styles.result}>{recommendation}</Text>
        )}
      </View>
    </ImageBackground>
  );
};

export default DanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
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
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
});
