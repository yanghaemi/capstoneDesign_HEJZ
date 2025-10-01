// LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, ImageBackground, StyleSheet, Text, TouchableOpacity, TextInput,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => navigation.navigate('Main');

  return (
    <ImageBackground
      source={require('../assets/background/newback.png')} // ← 로고+배경 합친 이미지
      style={styles.bg}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* ↑ 배경에 이미 로고가 있으므로, 별도 <Image> 필요 없음 */}

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="이메일"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#666"
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
              />

              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>로그인</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.helperText}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end', // 폼을 아래로
    paddingHorizontal: 24,
    paddingBottom: 32,          // 하단 여백
  },
  form: {
    gap: 14,                    // RN 0.79: gap/rowGap 지원
    backgroundColor: 'rgba(255,255,255,0.0)', // 필요시 반투명 박스 넣어도 OK
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    width: 200,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8FC',
    paddingVertical: 15,
    borderRadius: 25,
    borderColor: '#D6BBF6',
    borderWidth: 2,
    shadowColor: '#D6BBF6',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: { color: '#5B4DA7', fontWeight: 'bold', fontSize: 16 },
  helperText: { color: '#888', textAlign: 'center', marginTop: 8 },
});
