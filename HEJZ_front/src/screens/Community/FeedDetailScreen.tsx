// screens/FeedDetailScreen.tsx
import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert, FlatList,
  SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import Video from 'react-native-video';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { deleteFeed, getFeed } from '../../api/feed';
import { likeFeed, isLiked, getListOfLike } from '../../api/like';
import { BASE_URL } from '../../api/baseUrl';
import { createComment, getCommentsByFeed, deleteComment, CommentDto } from '../../api/comment';
import { fetchUserInfoById } from '../../api/user'; // ✅ username 가져오기 위해 추가
import Heart from '../../assets/icon/heart.png';
import HeartOutline from '../../assets/icon/heart-outline.png';
import CommentIcon from '../../assets/icon/comments.png';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
import type { FeedItemDto } from '../../api/types/feed';

// ---------- 타입 ----------
type ImageDto = { url: string; ord?: number };
type P = {
  feedId: number | string;
};

// ---------- 유틸 ----------
const { width, height } = Dimensions.get('window');

function absUrl(u?: string | null) {
  if (!u) return null;
  const t = String(u).trim();
  if (!t || t === '/' || t === 'null' || t === 'undefined') return null;
  return /^https?:\/\//i.test(t) ? t : `${BASE_URL}${t.startsWith('/') ? '' : '/'}${t}`;
}

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

// ========== 컴포넌트 ==========
export default function FeedDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, any>, string>>();

  const params = route.params as any;
  const feedId = Number(params?.feedId);

  console.log('[FeedDetail] 받은 params:', params);
  console.log('[FeedDetail] feedId:', feedId);

  // 상태
  const [feedData, setFeedData] = useState<FeedItemDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>(''); // ✅ username 상태 추가
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sending, setSending] = useState(false);

  // ✅ 좋아요 상태 관리
  const [isLikedState, setIsLikedState] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // ✅ 피드 데이터 및 좋아요 상태 초기 로드
  useEffect(() => {
    const loadFeedData = async () => {
      if (!feedId || isNaN(feedId)) {
        console.error('[FeedDetail] 유효하지 않은 feedId:', feedId);
        Alert.alert('오류', '잘못된 피드 ID입니다.');
        (navigation as any).goBack();
        return;
      }

      try {
        setLoading(true);
        console.log('[FeedDetail] feedId로 데이터 로드 시작:', feedId);

        // 1. 피드 데이터 가져오기
        const feed = await getFeed(feedId);
        console.log('[FeedDetail] 피드 데이터:', feed);
        setFeedData(feed);

        // 2. ✅ userId 추출 및 username 가져오기
        const rawUserId =
          (feed as any)?.userId ??
          (feed as any)?.user_id ??
          (feed as any)?.authorId ??
          (feed as any)?.author_id ??
          (feed as any)?.creator_id ??
          (feed as any)?.creatorId;

        const userId = Number(rawUserId);

        if (Number.isFinite(userId) && userId > 0) {
          try {
            const userInfo = await fetchUserInfoById(userId);
            const fetchedUsername =
              (userInfo as any)?.username ||
              (userInfo as any)?.userName ||
              (userInfo as any)?.name ||
              `user${userId}`;
            setUsername(fetchedUsername);
            console.log('[FeedDetail] username 로드 성공:', fetchedUsername);
          } catch (e) {
            console.error('[FeedDetail] username 로드 실패:', e);
            setUsername(`user${userId}`);
          }
        } else {
          // fallback username from feed data
          const fallbackUsername =
            (feed as any).username ||
            (feed as any).ownerUsername ||
            'unknown';
          setUsername(fallbackUsername);
        }

        // 3. 좋아요 상태 가져오기
        const checkIsLiked = await isLiked(feedId);
        setIsLikedState(checkIsLiked);

        // 4. 좋아요 개수 가져오기
        const likeList = await getListOfLike(feedId);
        const count = Array.isArray(likeList) ? likeList.length : 0;
        setLikeCount(count);

        console.log('[FeedDetail] 좋아요 상태:', { isLiked: checkIsLiked, count });

      } catch (e: any) {
        console.error('[FeedDetail] 데이터 로드 실패:', e?.message);
        Alert.alert('오류', e?.message ?? '피드를 불러올 수 없습니다.');
        (navigation as any).goBack();
      } finally {
        setLoading(false);
      }
    };

    loadFeedData();
  }, [feedId, navigation]);

  // media 리스트
  const media = useMemo(() => {
    if (!feedData) return [];

    const rawImages = Array.isArray((feedData as any).images)
      ? (feedData as any).images
      : Array.isArray((feedData as any).media)
      ? (feedData as any).media
      : [];

    const result = rawImages
      .slice()
      .sort((a: any, b: any) => (a.ord ?? 0) - (b.ord ?? 0))
      .map((m: any) => {
        const raw = m.url;
        const url = absUrl(raw);
        return { url, isVideo: isVideoUrl(raw) };
      })
      .filter((m: any) => !!m.url);

    console.log('[FeedDetail] 처리된 미디어 목록:', result);
    return result;
  }, [feedData]);

  const firstMedia = media[0];

  // 댓글 불러오기
  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const data = await getCommentsByFeed(feedId);
      setComments(data);
    } catch (e: any) {
      console.error('댓글 로드 실패:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) loadComments();
  }, [showComments]);

  // 댓글 작성
  const handleCreateComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }
    try {
      setSending(true);
      await createComment(feedId, commentText.trim());
      setCommentText('');
      await loadComments();
      Alert.alert('완료', '댓글이 작성되었습니다.');
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = (commentId: number) => {
    Alert.alert('삭제할까요?', '이 댓글을 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            await loadComments();
            Alert.alert('완료', '댓글이 삭제되었습니다.');
          } catch (e: any) {
            Alert.alert('실패', e?.message ?? '삭제 중 오류가 발생했습니다.');
          }
        }
      }
    ]);
  };

  // ✅ 좋아요 토글
  const toggleLike = async () => {
    try {
      // 1. 좋아요 토글 API 호출
      await likeFeed(feedId);
      console.log('[toggleLike] 좋아요 API 호출 성공');

      // 2. 좋아요 상태 확인 (true/false)
      const checkIsLiked = await isLiked(feedId);

      // 3. 좋아요 목록 가져오기 (개수 확인)
      const likeList = await getListOfLike(feedId);
      const newLikeCount = Array.isArray(likeList) ? likeList.length : 0;

      // 4. UI 업데이트
      setIsLikedState(checkIsLiked);
      setLikeCount(newLikeCount);

      console.log(`[toggleLike] feedId=${feedId}, isLiked=${checkIsLiked}, likeCount=${newLikeCount}`);

    } catch (e: any) {
      console.error('[toggleLike] 좋아요 실패:', e?.message);
      Alert.alert('알림', e?.message ?? '좋아요에 실패했어요.');
    }
  };

  // 게시글 삭제
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
            (navigation as any).goBack();
          } catch (e: any) {
            Alert.alert('실패', e?.message ?? '삭제 중 오류가 발생했습니다.');
          }
        }
      }
    ]);
  };

  // 로딩 중
  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>로딩 중...</Text>
      </View>
    );
  }

  // 데이터 없음
  if (!feedData) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 16 }}>피드를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const content = (feedData as any).content || '';

  return (
    <View style={s.screen}>
      {/* ✅ CommunityScreen 스타일 - 풀스크린 비디오 */}
      <View style={s.page}>
        {firstMedia ? (
          firstMedia.isVideo ? (
            <Video
              source={{ uri: firstMedia.url! }}
              style={s.video}
              resizeMode="cover"
              repeat
              paused={false}
              muted={false}
              onError={(error) => {
                console.error('[FeedDetail] Video 에러:', error);
                Alert.alert('비디오 로드 실패', JSON.stringify(error));
              }}
              onLoad={() => console.log('[FeedDetail] Video 로드 성공')}
            />
          ) : (
            <Image
              source={{ uri: firstMedia.url! }}
              style={s.video}
              resizeMode="cover"
              onError={(error) => {
                console.error('[FeedDetail] Image 에러:', error.nativeEvent.error);
              }}
              onLoad={() => console.log('[FeedDetail] Image 로드 성공')}
            />
          )
        ) : (
          <View style={s.fallback}>
            <Text style={s.fallbackTxt}>미디어 없음</Text>
          </View>
        )}

        {/* 그라디언트 */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={s.gradient} />

        {/* ✅ 상단 닫기 버튼 (CommunityScreen 스타일) */}
        <SafeAreaView style={s.topBar}>
          <View style={s.topBarInner}>
            <TouchableOpacity onPress={() => (navigation as any).goBack()} style={s.topBtn}>
              <Text style={s.topBtnTxt}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} style={s.topBtn}>
              <Text style={s.topBtnTxt}>삭제</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ✅ 오른쪽 액션 버튼 (CommunityScreen 스타일) */}
        <View style={s.actions}>
          <TouchableOpacity onPress={toggleLike} style={s.actionBtn} activeOpacity={0.8}>
            <Image
              source={isLikedState ? Heart : HeartOutline}
              style={s.icon}
              resizeMode="contain"
            />
            <Text style={s.count}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} onPress={() => setShowComments(true)} activeOpacity={0.8}>
            <Image source={CommentIcon} style={s.icon} resizeMode="contain" />
            <Text style={s.count}>{comments.length || (feedData as any).commentCount || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ 하단 텍스트 (CommunityScreen 스타일) */}
        <View style={s.bottomText}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.title}>@{username || 'unknown'}</Text>
          </View>
          {!!content && (
            <Text style={s.prompt} numberOfLines={2}>
              {content}
            </Text>
          )}
        </View>
      </View>

      {/* ✅ 댓글 모달 (CommunityScreen 스타일) */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={() => setShowComments(false)}
      >
        <View style={s.bottomSheet}>
          <View style={s.sheetBar} />
          <Text style={s.commentHeader}>
            댓글 {loadingComments ? '불러오는 중…' : `${comments.length}개`}
          </Text>

          <FlatList
            data={comments}
            keyExtractor={(item) => String(item.id)}
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

          <View style={s.commentRow}>
            <TextInput
              style={s.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="댓글을 입력하세요"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              onPress={handleCreateComment}
              disabled={sending || !commentText.trim()}
              style={[s.sendBtn, (sending || !commentText.trim()) && { opacity: 0.5 }]}
              activeOpacity={0.9}
            >
              <Text style={s.sendTxt}>{sending ? '전송중' : '등록'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowComments(false)} style={s.closeBtn}>
            <Text style={s.closeTxt}>닫기</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ✅ CommunityScreen과 동일한 스타일
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  page: { width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000' },
  video: { position: 'absolute', width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 200 },
  fallback: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 16 },
  fallbackTxt: { color: '#E5E7EB', fontSize: 14, textAlign: 'center' },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBarInner: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: Platform.OS === 'ios' ? 0 : 20,
  },
  topBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  topBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },

  actions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
    gap: 14
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center', minWidth: 36 },
  icon: { width: 30, height: 30, tintColor: '#fff' },
  count: { marginTop: 3, fontSize: 12, color: '#fff' },

  bottomText: { position: 'absolute', left: 12, right: 84, bottom: 60 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', marginRight: 8 },
  prompt: { marginTop: 6, fontSize: 14, color: '#E5E7EB' },

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
  sheetBar: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 10
  },
  commentHeader: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827'
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: '#587dc4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10
  },
  sendTxt: { color: '#fff', fontWeight: '700' },
  closeBtn: { alignSelf: 'center', marginTop: 10 },
  closeTxt: { color: '#587dc4', fontWeight: '700' },
});