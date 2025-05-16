import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SelectScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>무엇을 할까</Text> */}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Song')}
      >
        <Text style={styles.buttonText}>노래 만들기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Dance')}
      >
        <Text style={styles.buttonText}>안무 추천</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Community')}
      >
        <Text style={styles.buttonText}>둘러보기</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SelectScreen; // ✅ 꼭 함수 바깥에 써줘야 함!

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#A085FF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});
