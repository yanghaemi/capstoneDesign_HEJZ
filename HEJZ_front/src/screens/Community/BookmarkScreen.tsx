import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

// 북마크된 숏츠 아이템 타입 (likes 제거)
type ShortsItem = {
  id: string;
  title: string;
};

const BookmarkScreen = ({ route }: any) => {
  const bookmarkedShorts: ShortsItem[] = route?.params?.bookmarkedShorts ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>북마크 목록</Text>

      {bookmarkedShorts.length === 0 ? (
        <Text style={styles.emptyText}>아직 북마크한 숏츠가 없어요 </Text>
      ) : (
        <FlatList
          data={bookmarkedShorts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.shortsItem}>
              <View style={styles.thumbnail} />
              <Text style={styles.title}>{item.title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default BookmarkScreen;

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
    color: '#000',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 100,
  },
});
