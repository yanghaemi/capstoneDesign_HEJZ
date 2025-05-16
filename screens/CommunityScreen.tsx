import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const dummyShorts = [
  { id: '1', title: '🎵 감성 힙합 숏츠' },
  { id: '2', title: '🔥 파워 댄스 숏츠' },
  { id: '3', title: '🌈 감정 댄스 영상' },
];

const CommunityScreen = ({ navigation }: any) => {
  const renderItem = ({ item }: { item: { id: string; title: string } }) => (
    <View style={styles.shortsItem}>
      <Text style={styles.shortsText}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ 사람들이 올린 숏츠 ✨</Text>

      <FlatList
        data={dummyShorts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={styles.mypageButton}
        onPress={() => navigation.navigate('Feeds')}
      >
        <Text style={styles.buttonText}>마이페이지</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CommunityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 100,
  },
  shortsItem: {
    backgroundColor: '#F3F0FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  shortsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  mypageButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#A085FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
