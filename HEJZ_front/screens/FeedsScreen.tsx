import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const FeedScreen = ({ navigation }: any) => (
  <View style={styles.container}>
    <Text style={styles.text}>📱 내 숏츠 피드</Text>

    <TouchableOpacity
      style={styles.menuButton}
      onPress={() => navigation.navigate('MyPageOptions')}
    >
      <Text style={styles.menuText}>⋮</Text>
    </TouchableOpacity>
  </View>
);

export default FeedScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 20,
  },
  menuText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});