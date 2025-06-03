// screens/DanceScreen.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, ImageBackground } from 'react-native';

const dummySongs = [
  { id: '1', title: '나는야 장지혜야', prompt: '강렬하고 자유로운 느낌' },
  { id: '2', title: '아프잘 아프지마', prompt: '걱정하는 느낌' },
  { id: '3', title: '영은아 young하게 살자', prompt: '신나고 터지는 분위기' },
  { id: '4', title: '혜미가 아니라 해미라구요', prompt: '이름을 잘못불러서 분노에 가득참' },
];

const DanceScreen = ({ navigation }: any) => {
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const handleRecommend = () => {
    if (!selectedSongId) return;
    // 여기에 백엔드 연결 시 API 호출 (selectedSongId 기반)
    setRecommendation('추천된 안무: aist_003_bounce_tutorial'); // 임시값
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.item,
        item.id === selectedSongId && styles.selectedItem,
      ]}
      onPress={() => {
        setSelectedSongId(item.id);
        setTitle(item.title);
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.prompt}>{item.prompt}</Text>
    </TouchableOpacity>
  );

  return (
      <ImageBackground
                  source={require('../../assets/mainbackground.png')}
                  style={styles.background}
                  resizeMode="cover"
      >
        <View style={styles.container}>
          <Text style={styles.header}>노래를 선택해주세요 </Text>

          <FlatList
            data={dummySongs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />

          <Button
            title="안무 추천받기"
            onPress={() => navigation.navigate('DanceRecommendScreen', {title: title})}
            disabled={!selectedSongId}
          />

          {recommendation && <Text style={styles.result}>{recommendation}</Text>}
        </View>
      </ImageBackground>
  );
};

export default DanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    marginBottom: 20,
  },
  item: {
    padding: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#cde1ff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  prompt: {
    fontSize: 14,
    color: '#555',
  },
  result: {
    marginTop: 30,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
  background: {
         flex: 1,
        resizeMode: 'cover',
  },
});