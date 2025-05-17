import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

// 좋아요 누른 영상만 전달받는 구조라고 가정
const LikedScreen = ({ route }: any) => {
  const likedShorts = route?.params?.likedShorts ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>내가 좋아요 누른 숏츠</Text>

      {likedShorts.length === 0 ? (
        <Text style={styles.emptyText}>아직 좋아요 누른 숏츠가 없어요 💔</Text>
      ) : (
        <FlatList
          data={likedShorts}
          renderItem={({ item }) => (
            <View style={styles.shortsItem}>
              <View style={styles.thumbnail} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>💖 {item.likes}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default LikedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  listContainer: {
    paddingBottom: 100,
  },
  shortsItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#000',
  },
  meta: {
    fontSize: 14,
    color: '#555',
  },
  emptyText: {
  fontSize: 16,
  color: '#999',
  textAlign: 'center',
  marginTop: 100,
},

});
