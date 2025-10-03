// LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, ImageBackground, StyleSheet, Text, TouchableOpacity, TextInput,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { login } from '../api/auth';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState(''); // 아이디
  const [password, setPassword] = useState(''); // 비밀번호
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('로그인', '아이디와 비밀번호를 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      // 서버 DTO(LoginRequest)와 1:1 매핑
      const data = await login({ username, password });

      // 서버가 토큰을 준다면 여기서 저장 (응답 형태 유동적 처리)
      // 예: accessToken/token/jwt 등 키 대응
      const token =
        data?.accessToken ?? data?.token ?? data?.jwt ?? null;
      if (token) {
        console.log('로그인 토큰:', token);
      }

      // 성공 이동
      navigation.replace('Main');
    } catch (e: any) {
      const msg = String(e?.message ?? '').trim();
      if (msg.startsWith('401')) {
        Alert.alert('로그인 실패', '아이디와 비밀번호를 확인해주세요.');
      } else {
        Alert.alert('로그인 실패', msg || '서버 오류가 발생했어요.');
      }
      console.log('[LOGIN ERROR]', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background/newback.png')}
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
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="아이디 (username)"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#666"
                autoCapitalize="none"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={styles.buttonText}>로그인</Text>
                )}
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
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  form: {
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.0)',
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
