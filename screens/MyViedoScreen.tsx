import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyVideosScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>🎬 내가 만든 영상 목록</Text>
  </View>
);

export default MyVideosScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});
