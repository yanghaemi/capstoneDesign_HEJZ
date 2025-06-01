import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import { useApi } from "../../context/ApiContext";

const SongScreen = () => {
  const { apiUrl, apiKey } = useApi();

  const [loading, setLoading] = useState(false);
  const [songResult, setSongResult] = useState<string | null>(null);

  // suno 서버에 보낼 요청 형식 ------------------------------------------------
  const [prompt, setPrompt] = useState("");             // 프롬포트
  const [style, setStyle] = useState("");           // 곡 스타일 (장르 등) customMode가 false면 비워두기
  const [title, setTitle] = useState("");               // 제목
  const [customMode, setCustomMode] = useState(false);  // 가사 있음(false)<-default : instrumental 세팅에 상관없이 프롬포트만 필요 (프롬포트 길이 : 400자)
                                                        // 가사 없음 (ture) :
  const [instrumental, setInstrumental] = useState(false); // customMode가 false면 자동으로 false
  const [model, setModel] = useState("V3_5");               // 모델 별 프롬포트 길이 )
                                                        // V3_5 & V4: 3000 캐릭터, V4_5 : 5000 캐릭터
  const [callBackUrl, setCallBackUrl] = useState("https://b88e-115-20-243-238.ngrok-free.app/api/suno/callback");   // 콜백 url
  // ------------------------------------------------------------------------



  // 노래 생성하는 api 요청 함수
  const handleGenerateSong = async () => {
    setLoading(true);
    setSongResult(null);

    const headers = {}

    try {
        console.log(prompt);
        console.log(style);
        console.log(title);
        console.log(customMode);
        console.log(instrumental);
        console.log(model);
        console.log(callBackUrl);
        console.log(apiKey);

        const response = await axios.post(`${apiUrl}/api/suno/generate`,
            {
                "prompt": prompt,
                "style": style,
                "title": title,
                "customMode": customMode,
                "instrumental": instrumental,
                "model": model,
                "callBackUrl": callBackUrl
            },
            {
                headers: {
                  'Content-Type': 'application/json; charset=UTF-8',
                  'Authorization': `Bearer ${apiKey}`,
                },
            }
        );

        console.log("프롬포트: ", prompt);
        console.log(response.data); // 곡 생성 요청 성공시 응답 데이터 로그
        setSongResult('노래 생성 요청 완료!');
    } catch (error) {
      console.error('노래 생성 실패:', error);
      setSongResult('노래 생성에 실패했어요 ㅠㅠ');
    } finally{
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
          <Text style={styles.resultLabel}>생성된 노래: </Text>
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
