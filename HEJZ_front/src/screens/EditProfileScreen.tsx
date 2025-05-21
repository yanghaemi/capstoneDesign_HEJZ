import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditProfileScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>📝 내 정보 수정</Text>
  </View>
);

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});