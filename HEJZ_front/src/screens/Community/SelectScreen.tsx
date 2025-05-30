import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';

const SelectScreen = ({ navigation }: any) => {
  return (
    <ImageBackground 
      source={require('../assets/mainbackground.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* <Text style={styles.title}>무엇을 할까</Text> */}

        <TouchableOpacity onPress={() => navigation.navigate('Song')}>
          <ImageBackground
            source={require('../assets/star.png')}
            style={styles.imageButton}
            imageStyle={{ borderRadius: 12 }} // ⬅ 둥글게 하고 싶으면 유지
          >
            <Text style={styles.imageButtonText}>노래 만들기</Text>
          </ImageBackground>
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
    </ImageBackground>
  );
};

export default SelectScreen; // ✅ 꼭 함수 바깥에 써줘야 함!

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    color: '#000', // 글자색 확실하게
  },
  button: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 16,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  imageButton: {
  width: 200,
  height: 200,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 20,
},
imageButtonText: {
  color: '#333', 
  fontSize: 18,
  fontWeight: 'bold',
  textAlign: 'center',
  fontFamily: 'Ramche', 
},


});


