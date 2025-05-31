import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SelectScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Screen</Text>
      <Text style={styles.message}>여기에서 선택하세요!</Text>
    </View>
  );
};

export default SelectScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  message: {
    fontSize: 18,
    color: '#555',
  },
});