// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, ImageBackground, StyleSheet, Text, TouchableOpacity, TextInput,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { login } from '../api/auth';

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const u = username.trim();
    if (!u || !password) {
      Alert.alert('로그인', '아이디와 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      // ⬇︎ 토큰 저장까지 login()이 처리함 (AsyncStorage)
      const { sessionVersion } = await login({ username: u, password }); // ★ 받기

      // 메인으로 진입 (원하면 reset으로 완전 초기화)
      // navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { sessionVersion } }] });
    } catch (e: any) {
      const msg = (e?.message || '').toString();
      // 서버가 401이면 보통 "HTTP 401" 또는 커스텀 메시지
      if (/401/.test(msg)) {
        Alert.alert('로그인 실패', '아이디/비밀번호를 확인해주세요.');
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
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="아이디 (username)"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#666"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>로그인</Text>}
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
  form: { gap: 14, backgroundColor: 'rgba(255,255,255,0.0)' },
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
