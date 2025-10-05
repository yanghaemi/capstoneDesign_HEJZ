import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import Video from 'react-native-video';

const { width } = Dimensions.get('window');
const videoWidth = width * 0.9;
const videoHeight = videoWidth * 1.3;

interface MotionItem {
  motionId: string;
  videoUrl: string;
}

const TestScreen = () => {
  const [motionItems, setMotionItems] = useState<MotionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSelectedMotionVideos = async () => {
      try {
        const res = await fetch('http://52.78.174.239:8080/api/emotion/selections');
        const data = await res.json();

        console.log('📦 selections 응답 전체:', data);

        if (!Array.isArray(data)) {
          console.error('❌ selections 응답이 배열이 아님:', data);
          Alert.alert('서버 오류', `응답 형식이 배열이 아님\n\n${JSON.stringify(data, null, 2)}`);
          return;
        }

        // ✅ 받은 motionId 목록 출력
        console.log('✅ 받은 motionId 목록:', data.map((item: any) => item.motionId));

        const results: MotionItem[] = [];

        for (const item of data) {
          const motionId = item.motionId;
          try {
            const motionRes = await fetch(`http://52.78.174.239:8080/api/motion/${motionId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            });

            const text = await motionRes.text();
            console.log(`📨 /motion/${motionId} 응답:`, text);

            let url = '';
            if (text.startsWith('http')) {
              url = text.trim();
            } else {
              const json = JSON.parse(text);
              if (json.videoUrl?.startsWith('http')) {
                url = json.videoUrl;
              }
            }

            if (url) {
              results.push({ motionId, videoUrl: url });
            }
          } catch (err) {
            console.error(`⚠️ motion POST 실패 (${motionId}):`, err);
          }
        }

        setMotionItems(results);
      } catch (e) {
        console.error('❌ selections 전체 fetch 실패:', e);
        Alert.alert('네트워크 오류', '선택된 안무 정보를 불러오는 중 오류가 발생했어요.');
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedMotionVideos();
  }, []);


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#888" />
        <Text style={{ color: '#fff', marginTop: 10 }}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={motionItems}
        keyExtractor={(item) => item.motionId}
        renderItem={({ item }) => (
          <View style={{ alignItems: 'center' }}>
            <Video
              source={{ uri: item.videoUrl }}
              style={styles.video}
              resizeMode="cover"
              repeat
              paused={false}
              muted={false}
            />
            <View style={styles.card}>
              <Text style={styles.text}>🎬 motionId: {item.motionId}</Text>
              <Text style={styles.url}>🔗 {item.videoUrl}</Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
        contentContainerStyle={{ paddingVertical: 20 }}
      />
    </View>
  );
};

export default TestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingHorizontal: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: videoWidth,
    height: videoHeight,
    backgroundColor: '#222',
    borderRadius: 12,
  },
  card: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    width: '100%',
  },
  text: {
    color: 'white',
    marginBottom: 4,
    fontSize: 14,
  },
  url: {
    color: '#87cefa',
    fontSize: 12,
  },
});
