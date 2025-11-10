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
import { fetchTimeline, fetchGlobal, getFeed } from '../../api/feed'; // ✅ getFeed 추가
import type { FeedItemDto } from '../../api/types/feed';
import { BASE_URL } from '../../api/baseUrl';
import { createComment, getCommentsByFeed, deleteComment, type CommentDto } from '../../api/comment';
import Heart from '../../assets/icon/heart.png';
import HeartOutline from '../../assets/icon/heart-outline.png';
import CommentIcon from '../../assets/icon/comments.png';

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
  // media 우선, 없으면 images 확인
  const arr = Array.isArray(item?.media)
    ? item.media
    : Array.isArray(item?.images)
    ? item.images
    : [];

  if (arr.length === 0) {
    console.log('[pickFirstMediaUrlLocal] 미디어 없음:', {
      hasMedia: !!item?.media,
      hasImages: !!item?.images,
      media: item?.media,
      images: item?.images
    });
    return null;
  }

  const first = arr.slice().sort((a: any, b: any) => (a?.ord ?? 0) - (b?.ord ?? 0))[0];
  const url = normalizeAbsUrl(first?.url ?? null);

  console.log('[pickFirstMediaUrlLocal] URL 생성:', {
    originalUrl: first?.url,
    normalizedUrl: url,
    BASE_URL
  });

  return url;
}

// =============================================================
export default function CommunityScreen({ navigation }: any) {
  const [tab, setTab] = useState<'FOLLOWING' | 'EXPLORE'>('FOLLOWING');

  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [idNameMap, setIdNameMap] = useState<Map<number, string>>(new Map());

  const [activeIndex, setActiveIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [commentList, setCommentList] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sending, setSending] = useState(false);

  const blockedRef = useRef<Set<number | string>>(new Set());

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

  const load = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const fetcher = tab === 'EXPLORE' ? fetchGlobal : fetchTimeline;
        const resp = await fetcher({ limit: 10, cursor: reset ? null : cursor });

        if (resp.items.length > 0) {
          console.log(
            `[CommunityScreen/${tab}] First item (BEFORE getFeed):`,
            JSON.stringify(resp.items[0], null, 2)
          );
        }

        // ✅ 각 피드의 상세 정보를 가져와서 미디어 정보 추가
        const enrichedItems = await Promise.all(
          resp.items.map(async (item: any) => {
            // feedId 유효성 검사
            const feedId = Number(item.id);

            if (!Number.isFinite(feedId) || feedId <= 0) {
              console.warn(`[CommunityScreen] 유효하지 않은 feedId:`, item);
              return item; // 유효하지 않으면 원본 그대로 반환
            }

            try {
              const feedDetail = await getFeed(feedId);
              console.log(`[CommunityScreen] getFeed(${feedId}) 성공:`, feedDetail);

              // 상세 정보의 images/media를 원본 아이템에 추가
              return {
                ...item,
                images: (feedDetail as any).images || (feedDetail as any).media || item.images || [],
                media: (feedDetail as any).media || (feedDetail as any).images || item.media || null,
              };
            } catch (e: any) {
              console.error(`[CommunityScreen] getFeed(${feedId}) 실패:`, e?.message);
              return item; // 실패하면 원본 아이템 그대로 사용
            }
          })
        );

        console.log('[CommunityScreen] Enriched first item:', enrichedItems[0]);

        const filtered = enrichedItems.filter((it) => !blockedRef.current.has((it as any).userId));

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
    [cursor, loading, tab]
  );

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    load(true);
  }, [tab]);

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

  useEffect(() => {
    if (!items.length) return;

    const unknownIds = Array.from(
      new Set(
        items
          .map(i => {
            const rawUserId =
              (i as any)?.userId ??
              (i as any)?.user_id ??
              (i as any)?.authorId ??
              (i as any)?.author_id ??
              (i as any)?.creator_id ??
              (i as any)?.creatorId;

            const numUserId = Number(rawUserId);
            return numUserId;
          })
          .filter(n => Number.isFinite(n) && n > 0 && !idNameMap.has(n))
      )
    );

    if (unknownIds.length === 0) return;

    (async () => {
      const entries: [number, string][] = [];
      for (const uid of unknownIds) {
        try {
          const u = await fetchUserInfoById(uid);
          const username = (u as any)?.username || (u as any)?.userName || (u as any)?.name || `user${uid}`;
          entries.push([uid, username]);
        } catch {
          entries.push([uid, `user${uid}`]);
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
  }, [items]);

  const loadComments = useCallback(async (feedId: number) => {
    try {
      setLoadingComments(true);
      const list = await getCommentsByFeed(feedId);
      setCommentList(list);
    } catch (e: any) {
      console.error('[comments] load fail:', e?.message ?? e);
      Alert.alert('알림', e?.message ?? '댓글을 불러오지 못했어요.');
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (commentModalVisible && Number.isFinite(selectedId!)) {
      loadComments(selectedId!);
    } else {
      setCommentList([]);
      setCommentInput('');
    }
  }, [commentModalVisible, selectedId, loadComments]);

  const handleCreateComment = useCallback(async () => {
    const text = commentInput.trim();
    if (!text) return;
    if (!Number.isFinite(selectedId!)) {
      Alert.alert('알림', '선택된 게시글이 없습니다.');
      return;
    }
    try {
      setSending(true);
      await createComment(selectedId!, text);
      setCommentInput('');
      await loadComments(selectedId!);

      setItems(prev =>
        prev.map(it =>
          (it as any).id === selectedId
            ? { ...(it as any), commentCount: Math.max(0, Number((it as any).commentCount ?? 0)) + 1 }
            : it
        )
      );
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '댓글 등록에 실패했어요.');
    } finally {
      setSending(false);
    }
  }, [commentInput, selectedId, loadComments]);

  const handleDeleteComment = useCallback((commentId: number) => {
    Alert.alert('삭제할까요?', '이 댓글을 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            if (Number.isFinite(selectedId!)) {
              await loadComments(selectedId!);
              setItems(prev =>
                prev.map(it =>
                  (it as any).id === selectedId
                    ? { ...(it as any), commentCount: Math.max(0, Number((it as any).commentCount ?? 1) - 1) }
                    : it
                )
              );
            }
          } catch (e: any) {
            Alert.alert('실패', e?.message ?? '댓글 삭제에 실패했어요.');
          }
        }
      }
    ]);
  }, [selectedId, loadComments]);

  const toggleLike = (id: number) => {
    setItems((prev) =>
      prev.map((it) =>
        (it as any).id === id
          ? {
              ...(it as any),
              likeCount: Math.max(0, Number((it as any).likeCount ?? 0)) + (((it as any).isLiked ? -1 : 1) as number),
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
          setItems((prev) => prev.filter((it: any) => (it as any).userId !== userId));
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: FeedItemDto; index: number }) => {
    const playing = index === activeIndex;

    // ✅ 실제 피드 미디어 URL 가져오기
    const mediaUrl = pickFirstMediaUrlLocal(item);
    const isVideo = isVideoUrl(mediaUrl);

    // 🔍 디버깅 로그
    console.log('[CommunityScreen] renderItem:', {
      index,
      feedId: (item as any).id,
      images: (item as any).images,
      media: (item as any).media,
      mediaUrl,
      isVideo,
      BASE_URL,
    });

    const rawUserId =
      (item as any)?.userId ??
      (item as any)?.user_id ??
      (item as any)?.authorId ??
      (item as any)?.author_id ??
      (item as any)?.creator_id ??
      (item as any)?.creatorId;

    const userId = Number(rawUserId);

    const uname =
      (item as any).username ||
      (item as any).userName ||
      (item as any).author ||
      (item as any).creator ||
      (Number.isFinite(userId) && userId > 0 ? idNameMap.get(userId) : null) ||
      (Number.isFinite(userId) && userId > 0 ? `user${userId}` : 'unknown');

    return (
      <TouchableOpacity
        style={styles.page}
        activeOpacity={1}
        onPress={() => {
          // ✅ 피드 클릭시 FeedDetailScreen으로 이동
          navigation.navigate('FeedDetail' as never, { feedId: (item as any).id } as never);
        }}
      >
        {/* ✅ 실제 피드의 비디오/이미지 재생 */}
        {mediaUrl ? (
          isVideo ? (
            <Video
              source={{ uri: mediaUrl }}
              style={styles.video}
              resizeMode="cover"
              repeat
              paused={!playing}
              muted={false}
              onError={(error) => {
                console.error('[CommunityScreen] Video 에러:', error);
              }}
              onLoad={() => console.log('[CommunityScreen] Video 로드 성공:', mediaUrl)}
            />
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.video}
              resizeMode="cover"
              onError={(error) => {
                console.error('[CommunityScreen] Image 에러:', error.nativeEvent.error);
              }}
              onLoad={() => console.log('[CommunityScreen] Image 로드 성공:', mediaUrl)}
            />
          )
        ) : (
          <TouchableOpacity
            style={styles.fallback}
            onPress={() => {
              // 미디어가 없어도 FeedDetail로 이동하면 상세 정보 로드됨
              navigation.navigate('FeedDetail' as never, { feedId: (item as any).id } as never);
            }}
          >
            <Text style={styles.fallbackTxt}>미디어를 불러올 수 없습니다</Text>
            <Text style={[styles.fallbackTxt, { fontSize: 12, marginTop: 8 }]}>
              Feed ID: {(item as any).id}
            </Text>
            <Text style={[styles.fallbackTxt, { fontSize: 11, marginTop: 4, color: '#60A5FA' }]}>
              탭하여 상세 보기
            </Text>
          </TouchableOpacity>
        )}

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => toggleLike((item as any).id)} style={styles.actionBtn} activeOpacity={0.8}>
            <Image
              source={(item as any).isLiked ? Heart : HeartOutline}
              style={styles.icon}
              resizeMode="contain"
            />
            <Text style={styles.count}>
              {Number((item as any).likeCount ?? 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedId((item as any).id);
              setCommentModalVisible(true);
            }}
            style={styles.actionBtn}
            activeOpacity={0.8}
          >
            <Image
              source={CommentIcon}
              style={styles.icon}
              resizeMode="contain"
            />

            <Text style={styles.count}>
              {Number((item as any).commentCount ?? 0)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.actionBtn, { marginTop: 6 }]} activeOpacity={0.8}>
            <Text style={styles.more}>⋮</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomText}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.title}>@{uname}</Text>
            <TouchableOpacity
              onPress={() => Number.isFinite(userId) && userId > 0 && toggleFollow(userId)}
              style={styles.followBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.followTxt}>팔로우</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.prompt} numberOfLines={2}>
            {(item as any).content ?? ' '}
          </Text>
        </View>

        <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)} activeOpacity={1}>
            <View style={styles.popup}>
              <TouchableOpacity
                onPress={() => {
                  if (Number.isFinite(userId) && userId > 0) handleBlockUser(userId);
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
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

      <FlatList
        data={items}
        keyExtractor={(it: any) => String((it as any).id)}
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

      <Modal
        transparent
        visible={commentModalVisible}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.sheetBar} />
          <Text style={styles.commentHeader}>
            댓글 {loadingComments ? '불러오는 중…' : `${commentList.length}개`}
          </Text>

          <FlatList
            data={commentList}
            keyExtractor={(it) => String(it.id)}
            style={{ maxHeight: SCREEN_H * 0.45 }}
            ListEmptyComponent={
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280' }}>첫 댓글을 남겨보세요!</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onLongPress={() => handleDeleteComment(item.id)}
                delayLongPress={400}
                activeOpacity={0.8}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>
                  @{item.username} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Text style={{ fontSize: 15, color: '#111827' }}>{item.comment}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          />

          <View style={styles.commentRow}>
            <TextInput
              style={styles.commentInput}
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="댓글을 입력하세요"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              onPress={handleCreateComment}
              disabled={sending || !commentInput.trim()}
              style={[styles.sendBtn, (sending || !commentInput.trim()) && { opacity: 0.5 }]}
              activeOpacity={0.9}
            >
              <Text style={styles.sendTxt}>{sending ? '전송중' : '등록'}</Text>
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

  bottomText: { position: 'absolute', left: 12, right: 84, bottom: 60 },
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

  fallback: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 16, width: '100%', height: '100%' },
  fallbackTxt: { color: '#E5E7EB', fontSize: 14, textAlign: 'center' },
});