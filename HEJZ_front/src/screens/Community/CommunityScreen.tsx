// src/screens/CommunityScreen.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserInfoById } from '../../api/user';
import { fetchTimeline } from '../../api/feed';
import type { FeedItemDto } from '../../api/types/feed';
import { BASE_URL } from '../../api/baseUrl';
import { getAuthToken } from '../../api/auth';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// ---------- utils ----------
function isVideoUrl(u?: string | null) {
  if (!u) return false;
  return /\.(mp4|mov|m4v|webm|3gp)$/i.test(u);
}
function normalizeAbsUrl(u?: string | null) {
  if (!u) return null;
  const t = String(u).trim();
  if (!t || t === '/' || t === '#' || t === 'null' || t === 'undefined') return null;
  return /^https?:\/\//i.test(t) ? t : `${BASE_URL}${t.startsWith('/') ? '' : '/'}${t}`;
}
function pickFirstMediaUrlLocal(item: any): string | null {
  const arr = Array.isArray(item?.images)
    ? item.images
    : Array.isArray(item?.media)
    ? item.media
    : [];
  if (arr.length === 0) return null;
  const first = arr.slice().sort((a: any, b: any) => (a?.ord ?? 0) - (b?.ord ?? 0))[0];
  return normalizeAbsUrl(first?.url ?? null);
}

// 🔹 userId → username 조회 (POST /api/user/info { userId })
async function fetchUsernameById(userId: number): Promise<string | null> {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${BASE_URL}/api/user/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ userId }),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    const code = json?.code ?? res.status;
    if (code !== 200) return null;
    // 백엔드 data에 username 포함된다고 가정
    return json?.data?.username ?? null;
  } catch {
    return null;
  }
}

// =============================================================
export default function CommunityScreen({ navigation }: any) {
  const [tab, setTab] = useState<'FOLLOWING' | 'EXPLORE'>('FOLLOWING');

  // 데이터
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // userId -> username 캐시
  const [idNameMap, setIdNameMap] = useState<Map<number, string>>(new Map());

  // 재생 제어
  const [activeIndex, setActiveIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  // 모달/입력
  const [modalVisible, setModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 차단 목록
  const blockedRef = useRef<Set<number | string>>(new Set());

  // 최초 로드
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const blockedRaw = await AsyncStorage.getItem('blockedUsers');
        const blocked = new Set<number | string>(blockedRaw ? JSON.parse(blockedRaw) : []);
        blockedRef.current = blocked;
        await load(true);
        if (mounted) setActiveIndex(0);
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  // 타임라인 로드
  const load = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const resp = await fetchTimeline({ limit: 10, cursor: reset ? null : cursor });
        const filtered = resp.items.filter((it) => !blockedRef.current.has(it.userId));
        setItems((prev) => (reset ? filtered : [...prev, ...filtered]));
        setCursor(resp.nextCursor);
        setHasMore(Boolean(resp.nextCursor));
      } catch (e: any) {
        if (e?.message === 'RATE_LIMIT') {
          Alert.alert('잠시 후 다시 시도', '요청이 너무 많아요. 1분 후에 다시 시도해줘!');
        } else {
          Alert.alert('알림', e?.message ?? '불러오기 실패');
        }
      } finally {
        setLoading(false);
      }
    },
    [cursor, loading]
  );

  const onRefresh = useCallback(async () => {
    if (loading) return;
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load, loading]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loading) return;
    load(false);
  }, [hasMore, loading, load]);

  // ---------- NEW: items 변할 때 모르는 userId만 골라 username 캐싱 ----------
  useEffect(() => {
    if (!items.length) return;

    // userId를 number로 정규화해서 수집
    const ids = Array.from(
      new Set(
        items
          .map(i => Number((i as any)?.userId))
          .filter(n => Number.isFinite(n))
      )
    ).filter(id => !idNameMap.has(id));

    if (ids.length === 0) return;

    (async () => {
      const entries: [number, string][] = [];
      for (const uid of ids) {
        try {
          const u = await fetchUserInfoById(uid); // <- user.ts에 있는 함수 사용
          if (u?.username) entries.push([uid, u.username]);
        } catch (e) {
          // 무시 (네트워크/429 등)
        }
      }
      if (entries.length) {
        setIdNameMap(prev => {
          const next = new Map(prev);
          for (const [k, v] of entries) next.set(k, v);
          return next;
        });
      }
    })();
  }, [items]); // ✅ items가 바뀔 때만

  // 액션 (API 연동은 이후)
  const toggleLike = (id: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              // @ts-ignore
              likeCount: Math.max(0, (it as any).likeCount ?? 0) + (((it as any).isLiked ? -1 : 1) as number),
              // @ts-ignore
              isLiked: !(it as any).isLiked,
            }
          : it
      )
    );
  };

  const toggleFollow = (userId?: number) => {
    if (!userId) return;
    Alert.alert('팔로우', '나중에 API 연결!');
  };

  const handleBlockUser = async (userId?: number) => {
    if (!userId) return;
    Alert.alert('차단 확인', '정말 이 사용자를 차단할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: async () => {
          const raw = await AsyncStorage.getItem('blockedUsers');
          const list: any[] = raw ? JSON.parse(raw) : [];
          const updated = [...new Set([...list, userId])];
          await AsyncStorage.setItem('blockedUsers', JSON.stringify(updated));
          blockedRef.current = new Set(updated);
          setItems((prev) => prev.filter((it) => it.userId !== userId));
        },
      },
    ]);
  };

  // 댓글 데모 데이터 (API 붙기 전)
  const comments = useMemo(() => {
    const it = items.find((i) => i.id === selectedId);
    // @ts-ignore
    const c = (it as any)?.commentCount ?? 0;
    return new Array(Math.min(c, 30)).fill(0).map((_, i) => `댓글 ${i + 1}`);
  }, [items, selectedId]);

  // 1장 렌더
  const renderItem = ({ item, index }: { item: FeedItemDto; index: number }) => {
    const playing = index === activeIndex;
    const mediaUrl = pickFirstMediaUrlLocal(item);
    const isVideo = isVideoUrl(mediaUrl);

    // 🔹 표시용 username (없으면 일단 userId)
    const uname = typeof item.userId === 'number' ? (idNameMap.get(item.userId) ?? String(item.userId)) : 'user';

    return (
      <View style={styles.page}>
        {mediaUrl && isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.video}
            resizeMode="cover"
            repeat
            paused={!playing}
            muted={false}
          />
        ) : (
          <View style={[styles.video, styles.fallback]}>
            <Text style={styles.fallbackTxt} numberOfLines={3}>
              {item.content || '(내용 없음)'}
            </Text>
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />

        {/* 우측 액션 */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionBtn} activeOpacity={0.8}>
            <Image
              source={
                // @ts-ignore
                (item as any).isLiked
                  ? require('../../assets/icon/star.png')
                  : require('../../assets/icon/star-outline.png')
              }
              style={styles.icon}
              resizeMode="contain"
            />
            <Text style={styles.count}>
              {
                // @ts-ignore
                (item as any).likeCount ?? 0
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedId(item.id);
              setCommentModalVisible(true);
            }}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <Image source={require('../../assets/icon/comments.png')} style={styles.icon} resizeMode="contain" />
            <Text style={styles.count}>
              {
                // @ts-ignore
                (item as any).commentCount ?? 0
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.actionBtn, { marginTop: 6 }]} activeOpacity={0.8}>
            <Text style={styles.more}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* 좌하단 유저/콘텐츠 */}
        <View style={styles.bottomText}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.title}>@{uname}</Text>
            <TouchableOpacity onPress={() => toggleFollow(item.userId)} style={styles.followBtn} activeOpacity={0.85}>
              <Text style={styles.followTxt}>팔로우</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.prompt} numberOfLines={2}>
            {item.content ?? ' '}
          </Text>
        </View>

        {/* 더보기 팝업(차단/신고) */}
        <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
            <View style={styles.popup}>
              <TouchableOpacity
                onPress={() => {
                  handleBlockUser(item.userId);
                  setModalVisible(false);
                }}
                style={styles.popupRow}
              >
                <Text style={styles.popupTxt}>차단</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('신고 완료', '신고가 접수되었습니다.');
                  setModalVisible(false);
                }}
                style={styles.popupRow}
              >
                <Text style={styles.popupTxt}>신고</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* 탭 (지금은 팔로잉만 동작) */}
      <View style={styles.tabs}>
        {(['FOLLOWING', 'EXPLORE'] as const).map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setTab(k)}
            style={[styles.tab, tab === k && styles.tabOn]}
            activeOpacity={0.9}
          >
            <Text style={[styles.tabTxt, tab === k && styles.tabTxtOn]}>{k === 'FOLLOWING' ? '팔로잉' : '익스플로어'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 틱톡형 세로 스와이프 */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.85}
        onEndReached={onEndReached}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        getItemLayout={(_, index) => ({ length: SCREEN_H, offset: SCREEN_H * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* 댓글 모달 */}
      <Modal
        transparent
        visible={commentModalVisible}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.sheetBar} />
          <Text style={styles.commentHeader}>댓글</Text>
          <FlatList
            data={comments}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <Text style={styles.commentItem}>💬 {item}</Text>}
            style={{ maxHeight: SCREEN_H * 0.4 }}
          />
          <View style={styles.commentRow}>
            <TextInput
              style={styles.commentInput}
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="댓글을 입력하세요"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              onPress={() => {
                setCommentInput('');
              }}
              style={styles.sendBtn}
              activeOpacity={0.9}
            >
              <Text style={styles.sendTxt}>등록</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>닫기</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 12,
    zIndex: 20,
    flexDirection: 'row',
    gap: 8,
  },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  tabOn: { backgroundColor: '#587dc4' },
  tabTxt: { color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
  tabTxtOn: { color: '#fff' },

  page: { width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000' },
  video: { position: 'absolute', width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },

  actions: { position: 'absolute', right: 12, bottom: 120, alignItems: 'center', gap: 14 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 36 },
  icon: { width: 30, height: 30, tintColor: '#fff' },
  count: { marginTop: 3, fontSize: 12, color: '#fff' },
  more: { fontSize: 22, color: '#fff' },

  bottomText: { position: 'absolute', left: 12, right: 84, bottom: 30 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', marginRight: 8 },
  followBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 },
  followTxt: { fontSize: 12, color: '#fff' },
  prompt: { marginTop: 6, fontSize: 14, color: '#E5E7EB' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  popup: { backgroundColor: '#fff', borderRadius: 10, width: 220, overflow: 'hidden' },
  popupRow: { paddingVertical: 14, paddingHorizontal: 16 },
  popupTxt: { fontSize: 16, color: '#111827' },

  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetBar: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 10 },
  commentHeader: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  commentItem: { fontSize: 14, color: '#111827', paddingVertical: 4 },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#111827' },
  sendBtn: { marginLeft: 8, backgroundColor: '#587dc4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  sendTxt: { color: '#fff', fontWeight: '700' },
  closeBtn: { alignSelf: 'center', marginTop: 10 },
  closeTxt: { color: '#587dc4', fontWeight: '700' },

  fallback: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 16 },
  fallbackTxt: { color: '#E5E7EB', fontSize: 14, textAlign: 'center' },
});
