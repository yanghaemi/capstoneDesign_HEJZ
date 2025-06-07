import React from 'react';
import { View, Text, StyleSheet,Image, ImageBackground} from 'react-native';

const StatsScreen = () => {
  // 더미 통계 데이터
  const stats = {
    mostLiked: '양해미의 댄스쇼',
    songCount: 4,
    videoCount: 3,
    commentCount: 9,
  };

  return (
    <ImageBackground
          source={require('../assets/background/mainbackground.png')}
          style={styles.background}
          resizeMode="cover"
        >
      <View style={styles.container}>
        <Text style={styles.title}>내 콘텐츠 통계</Text>

        <View style={styles.section}>
          <Text style={styles.label}>가장 인기 있는 게시물</Text>
          <Text style={styles.value}>{stats.mostLiked}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>내가 만든 노래</Text>
          <Text style={styles.value}>{stats.songCount}곡</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>내가 만든 영상</Text>
          <Text style={styles.value}>{stats.videoCount}개</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>내가 쓴 댓글</Text>
          <Text style={styles.value}>{stats.commentCount}개</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
});