import React from 'react';
import { View, Image, ImageBackground, StyleSheet, Text,TouchableOpacity,Button } from 'react-native';

const MainScreen = ({ navigation }: any) => {
  const handleLogin = () => {
    navigation.navigate('Login'); // 로그인 화면으로 이동!
  };

  return (
    // <ImageBackground
    //   // source={require('../assets/background.png')}
    //   // style={styles.background}
    // >
      <View style={styles.container}>
        {/* <Button
        title="🎵 노래 만들기 테스트"
        onPress={() => navigation.navigate('Song')}
        />
        <Button
        title="🎵 안무 만들기 테스트"
        onPress={() => navigation.navigate('Dance')}
        />
        <Button
        title="🎵 마이페이지 테스트"
        onPress={() => navigation.navigate('Feeds')}
        /> */}
        <Image source={require('../assets/Photo.png')} style={styles.logo} />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.testButton} onPress={() => navigation.navigate('Select')} >
          <Text style={styles.buttonText}>테스트화면</Text>
        </TouchableOpacity>
      </View>
  );
};
export default MainScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor:'#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 400, 
    height: 150,
    marginBottom: 100,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#ffffffaa', // 흰색에 투명도
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  buttonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  testButton: {
  position: 'absolute',   // 📌 화면 위에 고정
  bottom: 30,             // 하단에서 30px 띄우기
  left: 20,               // 왼쪽에서 20px 띄우기
  backgroundColor: '#A085FF',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 10,
},

});
