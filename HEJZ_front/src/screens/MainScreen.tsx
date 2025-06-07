import React, { useState } from 'react';
import { View, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';

const MainScreen = ({ navigation }: any) => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('이메일:', email);
    console.log('비밀번호:', password);
    // 로그인 처리 로직 들어갈 부분
  };

  return (
    <ImageBackground source={require("../assets/background/background.png")} style={styles.background}>
      <View style={{ width: '100%', alignItems: 'center' }}>
        <Image
          source={require('../assets/icon/USTAR.png')}
          style={styles.logo}
          resizeMode="contain"
        />



        {!showLogin ? (
          <>
            <TouchableOpacity style={styles.button} onPress={() => setShowLogin(true)}>
              <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.buttonText}>회원가입</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Select')}>
              <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowLogin(false)}>
              <Text style={styles.cancelText}>← 뒤로가기</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <TouchableOpacity
                style={styles.recordButton}
                onPress={() => {
                  navigation.navigate('Dance', { screen: 'RecordScreen' }, {
                    fileName: 'song1', // 실제 파일명으로 바꿔줘도 됨
                  });
                }}
              >
                <Text style={styles.recordText}>📹 테스트 녹화</Text>
              </TouchableOpacity>
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
    backgroundColor:'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: '90%',          // 화면의 80% 너비로!
    height: undefined,
    aspectRatio: 3.5,        // 예: 가로:세로 비율이 4:1 정도
    marginTop: 240,
    marginBottom: 80,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 40,
  },
  button: {
      backgroundColor: '#FFF8FC',  // 연한 핑크 계열 배경
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 25,
      marginVertical: 10,
      width: 200,
      alignItems: 'center',
      borderColor: '#D6BBF6',      // 보라빛 살짝 돌게
      borderWidth: 2,
      shadowColor: '#D6BBF6',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
  buttonText: {
      color: '#5B4DA7', // 보라색 계열 텍스트
      fontWeight: 'bold',
      fontSize: 16,
  },

testButton: {
  position: 'absolute',
  bottom: 30,
  left: 20,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ccc',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  padding: 12,
  borderRadius: 16,
  backgroundColor: '#fff',
  marginBottom: 16,
  width: '80%',
},
cancelText: {
  color: '#888',
  marginTop: 12,
},
// logoText: {
//   fontSize: 60,
//   fontWeight: 'bold',
//   color: '#FEC260',
//   marginBottom: 100,
//   marginTop: 60,
//   fontFamily: 'Cafe24 Meongi B',
// },



});
