import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import { useApi } from '../../context/ApiContext';

const EMOTIONS = [
  '행복',
  '슬픔',
  '분노',
  '공포',
  '놀람',
  '혐오',
  '사랑',
  '희망',
  '열정',
  '자신감',
  '매혹',
  '도전',
  '차분함',
];

const SongScreen = () => {
  const { apiUrl, apiKey } = useApi();

  const [loading, setLoading] = useState(false);
  const [songResult, setSongResult] = useState<string | null>(null);

  // ====== 기존 필드 ======
  const [prompt, setPrompt] = useState(''); // 사용자가 쓰는 추가 설명
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState<'V3_5' | 'V4' | 'V4_5'>('V3_5');
  const [callBackUrl, setCallBackUrl] = useState(
    'https://9f1c-115-20-243-238.ngrok-free.app/api/suno/callback',
  );

  // ====== 감정(무드) 태그 선택 ======
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);

  const toggleEmotion = (emo: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  // Suno로 보낼 최종 프롬프트 구성
  const buildFinalPrompt = () => {
    // 선택된 감정들을 프롬프트 앞에 태그처럼 붙임
    // 예: [Mood: 행복, 사랑, 희망] 여름밤 해변에서 춤추는 느낌
    const mood = selectedEmotions.length ? `[Mood: ${selectedEmotions.join(', ')}] ` : '';
    return `${mood}${prompt}`.trim();
  };

  const handleGenerateSong = async () => {
    setLoading(true);
    setSongResult(null);

    const finalPrompt = buildFinalPrompt();

    try {
      const response = await axios.post(
        `${apiUrl}/api/suno/generate`,
        {
          prompt: finalPrompt,       // ✅ 감정이 합쳐진 프롬프트
          style: style,
          title: title,
          customMode: customMode,
          instrumental: customMode ? instrumental : false, // customMode가 false면 자동 false
          model: model,
          callBackUrl: callBackUrl,
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      console.log('Suno 응답:', response.data);
      setSongResult('노래 생성 요청 완료!');
    } catch (error) {
      console.error('노래 생성 실패:', error);
      setSongResult('노래 생성에 실패했어요 ㅠㅠ');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = (!prompt && selectedEmotions.length === 0) || loading;

  return (
    <ImageBackground
      source={require('../../assets/background/whitebackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>원하는 분위기를 선택/입력해보세요!</Text>

        {/* 감정 선택 칩 영역 */}
        <View style={styles.chipsWrap}>
          {EMOTIONS.map((emo) => {
            const active = selectedEmotions.includes(emo);
            return (
              <TouchableOpacity
                key={emo}
                onPress={() => toggleEmotion(emo)}
                activeOpacity={0.8}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {emo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 사용자가 추가로 설명할 자유 입력 프롬프트 */}
        <TextInput
          style={styles.input}
          placeholder="추가 프롬프트를 입력하세요 (예: 여름밤 해변에서 춤추는 느낌)"
          value={prompt}
          onChangeText={setPrompt}
          multiline={true}
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* 미리보기(최종 프롬프트) */}
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>최종 프롬프트 미리보기</Text>
          <Text style={styles.previewText}>{buildFinalPrompt() || '선택/입력 대기...'}</Text>
        </View>

        <Button title="노래 생성하기" onPress={handleGenerateSong} disabled={isSubmitDisabled} />

        {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

        {songResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>생성 상태</Text>
            <Text style={styles.resultText}>{songResult}</Text>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

export default SongScreen;

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    flexGrow: 1,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#d6d6d6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  chipActive: {
    borderColor: '#111',
    backgroundColor: '#111',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    height: 120,
    width: '100%',
  },
  previewBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  previewLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  previewText: {
    color: '#333',
  },
  resultContainer: {
    marginTop: 10,
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
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
});
