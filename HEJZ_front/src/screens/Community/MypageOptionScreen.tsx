import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const MyPageOptionsScreen = ({ navigation }: any) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>설정</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MySongs')}>
        <Text style={styles.buttonText}>내가 만든 노래</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MyVideos')}>
        <Text style={styles.buttonText}>내가 만든 영상</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Bookmark')}>
        <Text style={styles.buttonText}>북마크 목록</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('comments')}>
        <Text style={styles.buttonText}>내 댓글</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('States')}>
        <Text style={styles.buttonText}>내 콘텐츠 통계</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MyPageOptionsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
    color: '#000',
  },
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
});
