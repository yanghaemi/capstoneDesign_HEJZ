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
    <ImageBackground source={require("../assets/background.png")} style={styles.background}>
      <View style={styles.container}>
        <Image source={require("../assets/Photo.png")} style={styles.logo} />

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


});
