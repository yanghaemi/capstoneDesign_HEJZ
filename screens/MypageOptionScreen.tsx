import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const MyPageOptionsScreen = ({ navigation }: any) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>내 마이페이지 메뉴 💫</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MySongs')}>
        <Text style={styles.buttonText}>🎵 내가 만든 노래 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyVideos')}>
        <Text style={styles.buttonText}>🎬 내가 만든 영상 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.buttonText}>📝 내 정보 수정</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Likes')}>
        <Text style={styles.buttonText}>❤️ 좋아요 누른 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyComments')}>
        <Text style={styles.buttonText}>💬 내가 쓴 댓글 목록</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Stats')}>
        <Text style={styles.buttonText}>📊 내 콘텐츠 통계 보기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MyPageOptionsScreen;

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  button: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 10, marginBottom: 16 },
  buttonText: { fontSize: 16 },
});
