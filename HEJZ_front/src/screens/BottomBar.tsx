import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BottomBar = () => {
  const navigation = useNavigation();


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Main')}>
        <Text style={styles.button}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Community', { screen: 'MyRoom' })}>
        <Text style={styles.button}>내 방</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  button: {
    fontSize: 16,
  },
});
