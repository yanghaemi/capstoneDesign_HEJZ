// screens/MyProfileScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  Dimensions, TouchableOpacity, StatusBar, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { fetchMyFeeds, deleteFeed } from '../../api/feed';
import type { FeedItemDto } from '../../api/types/feed';
import { BASE_URL } from '../../api/baseUrl';
import USTAR from '../../assets/icon/U-STAR.png';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const THUMB = Math.floor((width - GAP * (COLS - 1)) / COLS);
const TAB_H = 58;

function absUrl(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`;
}
function isVideoUrl(u?: string | null) {
  if (!u) return false;
  return /\.(mp4|mov|m4v|webm|3gp)$/i.test(u);
}

type RouteP = RouteProp<Record<string, { newFeed?: FeedItemDto }>, string>;

export default function MyProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteP>();

  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // === 가드들 ===
  const didInitRef = useRef(false);            // 최초 1회 로드
  const loadingRef = useRef(false);
  const lastCursorRef = useRef<string | null>(null);
  const onEndGuardRef = useRef(false);
  const lastPageTsRef = useRef(0);

  const now = () => Date.now();

  // --- 최초 1회만 로드 ---
  useFocusEffect(
    useCallback(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;
      load(true);
    }, [])
  );

  // --- FeedCreateScreen에서 돌아올 때 새 글만 앞에 붙이기 ---
  useEffect(() => {
    const nf = (route.params as any)?.newFeed as FeedItemDto | undefined;
    if (!nf) return;
    setItems(prev => [nf, ...prev]);
    // 같은 파라미터로 재반영되지 않도록 클리어
    (navigation as any).setParams({ newFeed: undefined });
  }, [route.params, navigation]);

  const load = useCallback(async (reset = false) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    try {
      const cur = reset ? null : cursor;
      if (!reset && lastCursorRef.current === cur) return; // 같은 커서 재호출 방지

      const data = await fetchMyFeeds({ limit: 24, cursor: cur });

      const safe = (data.items ?? []).map(it => ({
        ...it,
        images: Array.isArray(it.images) ? it.images : [],
      }));

      if (reset) setItems(safe);
      else setItems(prev => [...prev, ...safe]);

      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.nextCursor));
      lastCursorRef.current = data.nextCursor ?? null;
    } catch (e: any) {
      const msg = String(e?.message || '');
      Alert.alert('알림', msg || '요청 실패');
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [cursor]);

  // 당겨서 새로고침은 “한 번만 API” — 전체 초기화 후 1회 로드
  const onRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    try {
      lastCursorRef.current = null;
      setCursor(null);
      setHasMore(true);
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  // 페이징(최소 간격 1.2s + 모멘텀 가드)
  const onEndReached = useCallback(() => {
    if (onEndGuardRef.current) return;
    onEndGuardRef.current = true;

    if (!hasMore || loadingRef.current) return;

    const lastTs = lastPageTsRef.current;
    if (now() - lastTs < 1200) return;
    lastPageTsRef.current = now();

    load(false);
  }, [hasMore, load]);

  const onMomentumScrollBegin = useCallback(() => {
    onEndGuardRef.current = false;
  }, []);

  const handleLongPressDelete = (feedId: number) => {
    Alert.alert('삭제할까요?', '이 피드를 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeed(feedId);
            setItems(prev => prev.filter(f => f.id !== feedId));
          } catch (e: any) {
            Alert.alert('알림', e?.message ?? '삭제 실패');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FeedItemDto }) => {
    const raw = item.images?.[0]?.url;
    const uri = absUrl(raw);
    const isVideo = isVideoUrl(raw);

    return (
      <TouchableOpacity
        style={s.gridItem}
        activeOpacity={0.85}
        onPress={() =>
          (navigation as any).navigate('FeedDetail', {
            feedId: item.id,
            content: item.content,
            images: item.images,
          })
        }
        onLongPress={() => handleLongPressDelete(item.id)}
      >
        {uri ? (
          isVideo ? (
            <View style={s.videoCover}>
              <Text style={s.playIcon}>▶</Text>
            </View>
          ) : (
            <Image source={{ uri }} style={s.thumbImg} />
          )
        ) : (
          <View style={s.thumbCover}>
            <Text numberOfLines={3} style={s.noImgText}>
              {item.content || '(내용 없음)'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.screen}>
      <SafeAreaView />
      <StatusBar barStyle="light-content" backgroundColor="#0B1020" />

      <View style={s.appbar}>
        <Image source={USTAR} resizeMode="contain" style={s.logo} />
      </View>

      <View style={s.profileRow}>
        <Image source={{ uri: 'https://picsum.photos/200/200' }} style={s.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>u-star | 지혜</Text>
          <Text style={s.meta}>Fans 1,248 · Works {items.length}</Text>
        </View>
        <TouchableOpacity style={s.editBtn} onPress={() => (navigation as any).navigate('EditProfile')}>
          <Text style={s.editTxt}>편집</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_H + 20 }}
        onEndReachedThreshold={0.6}
        onEndReached={onEndReached}
        onMomentumScrollBegin={onMomentumScrollBegin}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={
          !hasMore ? <Text style={s.footer}>끝이에요</Text> :
          isLoading ? <Text style={s.footer}>불러오는 중…</Text> : null
        }
      />

      <TouchableOpacity
        style={s.fab}
        onPress={() => (navigation as any).navigate('FeedCreate')}
      >
        <Text style={{ color:'#fff', fontSize:24 }}>＋</Text>
      </TouchableOpacity>

      <View style={s.tabbar}>
        <Tab icon="🎵" label="노래생성" onPress={() => (navigation as any).navigate('Music')} />
        <Tab icon="👀" label="숏츠" onPress={() => (navigation as any).navigate('Community', { screen: 'Community' })} />
        <Tab icon="🕺" label="안무+녹화" onPress={() => (navigation as any).navigate('Dance', { screen: 'DanceScreen' })} />
      </View>
    </View>
  );
}

function Tab({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.tabItem} onPress={onPress} activeOpacity={0.8}>
      <Text style={s.tabIcon}>{icon}</Text>
      <Text style={s.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  appbar: {
    height: 56, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0B1020', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0B1020',
  },
  logo: { width: 96, height: 28 },

  profileRow: {
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#111827' },
  editTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  gridItem: { width: THUMB, height: THUMB, backgroundColor: '#FFF' },
  thumbImg: { width: '100%', height: '100%' },

  thumbCover: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 8 },
  noImgText: { fontSize: 11, color: '#E5E7EB', textAlign: 'center' },

  videoCover: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  playIcon: { fontSize: 28, color: '#FFFFFF' },

  footer: { textAlign: 'center', color: '#6B7280', paddingVertical: 10 },

  fab: {
    position: 'absolute', right: 16, bottom: 72, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center'
  },

  tabbar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: TAB_H,
    backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', minWidth: width / 3 },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 11, color: '#111827', fontWeight: '600' },
});
