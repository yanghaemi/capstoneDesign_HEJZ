import React from 'react';
import { View, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, Button } from 'react-native';

const MainScreen = ({ navigation }: any) => {
  const handleLogin = () => {
    navigation.navigate('Login');
  };
  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <ImageBackground
      source={require('../assets/background.png')}
      style={styles.background}
    >
      <View style={styles.container}>
        <Button
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
        />
        <Image source={require('../assets/Logo.png')} style={styles.logo} />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#ffffffaa',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginVertical: 10,
    width: 200, // Tugmalarni bir xil kenglikka majburlash uchun
    alignItems: 'center', // Matnni markazlashtirish uchun
  },
  buttonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
});
