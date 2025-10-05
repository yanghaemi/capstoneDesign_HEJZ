// screens/FeedDetailScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert, FlatList, SafeAreaView
} from 'react-native';
import Video from 'react-native-video';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { deleteFeed } from '../../api/feed';
import { BASE_URL } from '../../api/baseUrl';

type ImageDto = { url: string; ord: number };
type P = {
  feedId: number;
  content?: string;
  images?: ImageDto[];
};

const { width } = Dimensions.get('window');

function absUrl(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`;
}
function isVideoUrl(u?: string | null) {
  if (!u) return false;
  return /\.(mp4|mov|m4v|webm|3gp)$/i.test(u);
}

export default function FeedDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, P>, string>>();
  const { feedId, content, images } = (route.params || {}) as P;

  // media 리스트 (절대 경로 + 타입 판별)
  const media = useMemo(() => {
    const arr = Array.isArray(images) ? images : [];
    return arr
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
      .map(m => {
        const raw = m.url;
        const url = absUrl(raw);
        return { url, isVideo: isVideoUrl(raw) };
      })
      .filter(m => !!m.url);
  }, [images]);

  const [index, setIndex] = useState(0);
  const current = media[index];

  const confirmDelete = () => {
    Alert.alert('삭제할까요?', '이 게시글을 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeed(feedId);
            Alert.alert('완료', '삭제되었습니다.');
            // 목록 새로고침되도록 돌아가기
            // @ts-ignore
            (navigation as any).navigate('MyRoom', { removedId: feedId });
          } catch (e: any) {
            Alert.alert('실패', e?.message ?? '삭제 중 오류가 발생했습니다.');
          }
        }
      }
    ]);
  };

  return (
    <View style={s.screen}>
      <SafeAreaView />
      {/* 상단 닫기/삭제 버튼 */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={s.topBtn}>
          <Text style={s.topBtnTxt}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} style={s.topBtn}>
          <Text style={s.topBtnTxt}>삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 미디어 영역 */}
      <View style={s.mediaWrap}>
        {current ? (
          current.isVideo ? (
            <Video
              source={{ uri: current.url! }}
              style={s.media}
              controls
              resizeMode="contain"
            />
          ) : (
            <Image source={{ uri: current.url! }} style={s.media} resizeMode="contain" />
          )
        ) : (
          <View style={s.placeholder}>
            <Text style={{ color: '#9CA3AF' }}>미디어 없음</Text>
          </View>
        )}
      </View>

      {/* 썸네일 스트립 (여러 장일 때 선택) */}
      {media.length > 1 && (
        <FlatList
          data={media}
          keyExtractor={(_, i) => String(i)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          style={{ marginTop: 8 }}
          renderItem={({ item, index: i }) => (
            <TouchableOpacity onPress={() => setIndex(i)} style={[s.thumbBox, i === index && s.thumbBoxActive]}>
              {item.isVideo ? (
                <View style={[s.thumb, { backgroundColor: '#0F172A' }]}>
                  <Text style={{ color: '#fff' }}>▶</Text>
                </View>
              ) : (
                <Image source={{ uri: item.url! }} style={s.thumb} />
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* 본문 */}
      {!!content && (
        <View style={s.contentBox}>
          <Text style={s.contentTxt}>{content}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  topBar: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 12,
  },
  topBtn: { padding: 6 },
  topBtnTxt: { color: '#fff', fontSize: 16 },

  mediaWrap: { width, height: width * 0.75, alignItems: 'center', justifyContent: 'center' },
  media: { width, height: width * 0.75 },
  placeholder: { width, height: width * 0.75, alignItems: 'center', justifyContent: 'center' },

  thumbBox: { marginHorizontal: 6, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  thumbBoxActive: { borderColor: '#fff' },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#222' },

  contentBox: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  contentTxt: { color: '#E5E7EB', fontSize: 15, lineHeight: 22 },
});
