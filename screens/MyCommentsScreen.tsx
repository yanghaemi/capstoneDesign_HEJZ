import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyCommentsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>💬 내가 쓴 댓글 목록</Text>
  </View>
);

export default MyCommentsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});
