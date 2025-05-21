import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>📊 내 콘텐츠 통계</Text>
  </View>
);

export default StatsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});