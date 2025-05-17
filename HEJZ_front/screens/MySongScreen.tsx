// screens/MySongsScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const mockSongs = [
  {
    id: 1,
    title: '나는야 장지혜야야',
    prompt: '자신감있는 장지혜',
    url: 'https://example.com/song1.mp3',
  },
  {
    id: 2,
    title: '파티 댄스곡',
    prompt: '신나는 파티 분위기',
    url: 'https://example.com/song2.mp3',
  },
  {
    id: 3,
    title: '감성 발라드',
    prompt: '이별 후의 감정',
    url: 'https://example.com/song3.mp3',
  },
];

const MySongsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🎵 내가 만든 노래</Text>
      <FlatList
        data={mockSongs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.songCard}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.prompt}>프롬프트: {item.prompt}</Text>
            <Text style={styles.url}>URL: {item.url}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default MySongsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  songCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  prompt: {
    fontSize: 14,
    marginTop: 4,
  },
  url: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
