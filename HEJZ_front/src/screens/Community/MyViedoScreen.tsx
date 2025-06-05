import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const videos: any[] = []; // 나중에 영상 데이터 들어올 자리

const MyDanceScreen = () => {
  const renderItem = ({ item }: any) => (
    <View style={styles.videoItem}>
      <Text style={styles.title}>{item.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>영상 목록</Text>
      {videos.length === 0 ? (
        <Text style={styles.emptyText}>아직 만들어진 영상이 없어요 </Text>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

export default MyDanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center', marginTop: 20, color: '#888' },
  listContainer: { paddingBottom: 20 },
  videoItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
  },
  title: { fontSize: 16 },
});
