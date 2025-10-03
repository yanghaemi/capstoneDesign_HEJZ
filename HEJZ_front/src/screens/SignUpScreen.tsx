// screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signUp } from '../api/auth';
import { cacheMyProfile } from '../api/user'; // ← 추가

const SignUpScreen = () => {
  const [username, setUsername] = useState('');          // 아이디
  const [password, setPassword] = useState('');          // 비밀번호
  const [email, setEmail] = useState('');                // 이메일
  const [nickname, setNickname] = useState('');          // 닉네임
  const [profileImageUrl, setProfileImageUrl] = useState(''); // 프로필 이미지 URL
  const [bio, setBio] = useState('');                    // 자기소개
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (!username || !password || !email || !nickname) {
      Alert.alert('회원가입', '아이디/비밀번호/이메일/닉네임은 필수야!');
      return;
    }
    setLoading(true);
    try {
      // 1) 서버 가입 요청
      await signUp({
        username,
        password,
        email,
        nickname,
        profileImageUrl: profileImageUrl.trim(),
        bio: bio.trim(),
      });

      // 2) 입력값을 로컬 캐시 (로그인 전에도 프로필 화면에서 보이게)
      await cacheMyProfile({
        username,
        nickname,
        bio: bio.trim(),
        avatarUrl: profileImageUrl.trim(),
        followers: 0,
        following: 0,
      });

      Alert.alert('회원가입 완료', '이제 로그인해줘!');
      // @ts-ignore
      navigation.replace?.('Login') ?? navigation.goBack();
    } catch (err: any) {
      Alert.alert('회원가입 실패', err?.message ?? '잠시 후 다시 시도해줘');
      console.log('signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    // @ts-ignore
    navigation.goBack?.();
  };

  return (
    <ImageBackground
      source={require('../assets/background/background.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>회원가입</Text>

          {/* 아이디 */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="아이디 (username)"
              style={styles.input}
              placeholderTextColor="#A0A0A0"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="비밀번호"
              secureTextEntry
              style={styles.input}
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* 이메일 */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="이메일"
              style={styles.input}
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* 닉네임 */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="닉네임"
              style={styles.input}
              placeholderTextColor="#A0A0A0"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          {/* 프로필 이미지 URL (선택) */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="프로필 이미지 URL (선택)"
              style={styles.input}
              placeholderTextColor="#A0A0A0"
              value={profileImageUrl}
              onChangeText={setProfileImageUrl}
              autoCapitalize="none"
            />
          </View>

          {/* 자기소개 (선택, 멀티라인) */}
          <View style={[styles.inputContainer, { height: 100 }]}>
            <TextInput
              placeholder="자기소개 (선택)"
              style={[styles.input, { height: 100 }]}
              placeholderTextColor="#A0A0A0"
              value={bio}
              onChangeText={setBio}
              multiline
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>회원가입</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  background: { flex: 1, resizeMode: 'cover' },
  overlay: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    gap: 12,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  backButtonText: { fontSize: 24, color: '#333', fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#3399FF' },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15, overflow: 'hidden',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  input: { padding: 15, fontSize: 16, color: '#0080FF' },
  button: {
    backgroundColor: '#66B2FF', paddingVertical: 16, borderRadius: 15,
    alignItems: 'center', marginTop: 10, elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 5,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 20, textTransform: 'uppercase' },
});
