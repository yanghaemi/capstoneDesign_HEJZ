import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

const SongScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [songResult, setSongResult] = useState<string | null>(null);

  const handleGenerateSong = async () => {
    setLoading(true);
    setSongResult(null);

    try {
      //여기에 백엔드 API 연동 예정 
      setTimeout(() => {
        setSongResult('https://example.com/generated-song.mp3');
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('노래 생성 실패:', error);
      setSongResult('노래 생성에 실패했어요 ㅠㅠ');
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🎵 나만의 노래 만들기</Text>

      <TextInput
        style={styles.input}
        placeholder="프롬프트를 입력하세요 (예: 여름밤 해변에서 춤추는 느낌)"
        value={prompt}
        onChangeText={setPrompt}
      />

      <Button title="노래 생성하기" onPress={handleGenerateSong} disabled={!prompt || loading} />

      {loading && <ActivityIndicator size="large" color="#888" style={{ marginTop: 20 }} />}

      {songResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>생성된 노래:</Text>
          <Text style={styles.resultText}>{songResult}</Text>
          {/* 나중에: 오디오 플레이어나 공유 버튼 연결 */}
        </View>
      )}
    </ScrollView>
  );
};

export default SongScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 30,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 10,
  },
  resultLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
  resultText: {
    color: '#333',
  },
});
