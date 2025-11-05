// screens/FeedDetailScreen.tsx
import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert, FlatList,
  SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import Video from 'react-native-video';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { deleteFeed, getFeed } from '../../api/feed'; // ✅ getFeed import 추가
import { likeFeed, isLiked, getListOfLike } from '../../api/like';
import { BASE_URL } from '../../api/baseUrl';
import { createComment, getCommentsByFeed, deleteComment, CommentDto } from '../../api/comment';
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
  const [index, setIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

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
      // ... 나머지 코드
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

  const current = media[index];

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
      await createComment(feedId, commentText.trim());
      setCommentText('');
      await loadComments();
      Alert.alert('완료', '댓글이 작성되었습니다.');
    } catch (e: any) {
      Alert.alert('실패', e?.message ?? '댓글 작성 중 오류가 발생했습니다.');
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

  const uname = (feedData as any).username || (feedData as any).ownerUsername || 'unknown';
  const content = (feedData as any).content || '';

  return (
    <View style={s.screen}>
      {/* 풀스크린 미디어 */}
      <View style={s.mediaWrap}>
        {current ? (
          current.isVideo ? (
            <Video
              source={{ uri: current.url! }}
              style={s.media}
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
              source={{ uri: current.url! }}
              style={s.media}
              resizeMode="cover"
              onError={(error) => {
                console.error('[FeedDetail] Image 에러:', error.nativeEvent.error);
                Alert.alert('이미지 로드 실패', '이미지를 불러올 수 없습니다.');
              }}
              onLoad={() => console.log('[FeedDetail] Image 로드 성공')}
            />
          )
        ) : (
          <View style={s.placeholder}>
            <Text style={{ color: '#9CA3AF' }}>미디어 없음</Text>
          </View>
        )}
      </View>

      {/* 하단 그라디언트 */}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={s.gradient} />

      {/* 상단 닫기/삭제 버튼 */}
      <View style={s.topBar}>
        <SafeAreaView />
        <View style={s.topBarInner}>
          <TouchableOpacity onPress={() => (navigation as any).goBack()} style={s.topBtn}>
            <Text style={s.topBtnTxt}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={s.topBtn}>
            <Text style={s.topBtnTxt}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 오른쪽 아이콘 */}
      <View style={s.rightIcons}>
        {/* 좋아요 버튼 */}
        <TouchableOpacity onPress={toggleLike} style={s.iconBtn} activeOpacity={0.85}>
          <Image
            source={isLikedState ? HeartOutline : Heart}
            style={s.icon}
            resizeMode="contain"
          />
          <Text style={s.iconCount}>{likeCount}</Text>
        </TouchableOpacity>

        {/* 댓글 버튼 */}
        <TouchableOpacity style={s.iconBtn} onPress={() => setShowComments(true)} activeOpacity={0.85}>
          <Image source={CommentIcon} style={s.icon} resizeMode="contain" />
          <Text style={s.iconCount}>{comments.length || (feedData as any).commentCount || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 콘텐츠 */}
      <View style={s.bottomContainer}>
        <View style={s.bottomText}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.username}>@{uname}</Text>
          </View>

          {!!content && (
            <View style={s.contentWrapper}>
              <TouchableOpacity onPress={() => setShowContent(!showContent)} style={s.contentToggle}>
                <Text style={s.contentToggleTxt}>{showContent ? '▼' : '▲'}</Text>
              </TouchableOpacity>
              {showContent && (
                <ScrollView
                  style={s.contentScroll}
                  contentContainerStyle={s.contentScrollInner}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={s.contentTxt}>{content}</Text>
                </ScrollView>
              )}
            </View>
          )}
        </View>

        {/* 썸네일 스트립 */}
        {media.length > 1 && (
          <FlatList
            data={media}
            keyExtractor={(_, i) => String(i)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            style={s.thumbStrip}
            renderItem={({ item, index: i }) => (
              <TouchableOpacity onPress={() => setIndex(i)} style={[s.thumbBox, i === index && s.thumbBoxActive]}>
                {item.isVideo ? (
                  <View style={[s.thumb, { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>▶</Text>
                  </View>
                ) : (
                  <Image source={{ uri: item.url! }} style={s.thumb} />
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* 댓글 모달 */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalContainer}>
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowComments(false)} />
          <View style={s.commentsSheet}>
            <View style={s.commentsHeader}>
              <Text style={s.commentsTitle}>댓글 {comments.length}개</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListEmptyComponent={
                <View style={s.emptyComments}>
                  <Text style={s.emptyTxt}>{loadingComments ? '불러오는 중...' : '첫 댓글을 남겨보세요!'}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={s.commentItem}>
                  <View style={s.commentHeaderRow}>
                    <Text style={s.commentUsername}>@{item.username}</Text>
                    <Text style={s.commentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={s.commentText}>{item.comment}</Text>

                  <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={s.deleteCommentBtn}>
                    <Text style={s.deleteCommentTxt}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <View style={s.commentInputWrapper}>
              <TextInput
                style={s.commentInput}
                placeholder="댓글을 입력하세요..."
                placeholderTextColor="#9CA3AF"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity style={s.sendBtn} onPress={handleCreateComment} disabled={!commentText.trim()}>
                <Text style={[s.sendBtnTxt, !commentText.trim() && s.sendBtnDisabled]}>전송</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  mediaWrap: { position: 'absolute', top: 0, left: 0, width, height, alignItems: 'center', justifyContent: 'center' },
  media: { width, height },
  placeholder: { width, height, alignItems: 'center', justifyContent: 'center', padding: 20 },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.25)', zIndex: 10 },
  topBarInner: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  topBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  topBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },

  rightIcons: { position: 'absolute', right: 16, bottom: height * 0.25, zIndex: 10, gap: 18 },
  iconBtn: { alignItems: 'center', padding: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
  icon: { width: 32, height: 32, tintColor: '#fff' },
  iconCount: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 4 },

  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  bottomText: { paddingHorizontal: 12, paddingBottom: 8 },
  username: { fontSize: 18, fontWeight: '800', color: '#fff', marginRight: 8 },

  contentWrapper: { maxHeight: height * 0.35 },
  contentToggle: { alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', marginTop: 6 },
  contentToggleTxt: { color: '#fff', fontSize: 12 },
  contentScroll: { maxHeight: height * 0.3 },
  contentScrollInner: { paddingHorizontal: 2, paddingBottom: 12 },
  contentTxt: { color: '#E5E7EB', fontSize: 15, lineHeight: 22 },

  thumbStrip: { maxHeight: 86, backgroundColor: 'rgba(0,0,0,0.35)' },
  thumbBox: { marginHorizontal: 4, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbBoxActive: { borderColor: '#fff' },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#222' },

  modalContainer: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  commentsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  commentsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  commentsTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { fontSize: 24, color: '#6B7280' },

  commentItem: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  commentHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentUsername: { fontSize: 14, fontWeight: '700', color: '#374151' },
  commentDate: { fontSize: 12, color: '#9CA3AF' },
  commentText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  deleteCommentBtn: { alignSelf: 'flex-end', marginTop: 4, paddingHorizontal: 8, paddingVertical: 4 },
  deleteCommentTxt: { fontSize: 12, color: '#EF4444' },
  emptyComments: { paddingVertical: 40, alignItems: 'center' },
  emptyTxt: { fontSize: 14, color: '#9CA3AF' },

  commentInputWrapper: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff' },
  commentInput: { flex: 1, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 20, fontSize: 14, color: '#111827' },
  sendBtn: { marginLeft: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#587dc4' },
  sendBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sendBtnDisabled: { opacity: 0.5 },
});