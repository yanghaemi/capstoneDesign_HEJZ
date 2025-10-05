
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BottomBar = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
        <Image source={require('../assets/icon/Home.png')} style={styles.icon} />
        <Text style={styles.buttonText}>홈</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Community', { screen: 'MyRoom' })}>
        <Image source={require('../assets/icon/Room.png')} style={styles.icon} />
        <Text style={styles.buttonText}>내 방</Text>
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
    backgroundColor: '#E6F0FA',
    borderTopWidth: 1,
    borderTopColor: '#B0C4DE',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

  },
  button: {
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    tintColor: '#5B9BD5',
  },
  buttonText: {
    fontSize: 12,
    color: '#5B9BD5',
    fontWeight: '600',
  },
});