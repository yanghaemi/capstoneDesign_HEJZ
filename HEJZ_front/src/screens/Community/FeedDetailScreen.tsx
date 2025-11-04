// screens/FeedDetailScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Alert, FlatList,
  SafeAreaView, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal
} from 'react-native';
import Video from 'react-native-video';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { deleteFeed } from '../../api/feed';
import { BASE_URL } from '../../api/baseUrl';
import { createComment, getCommentsByFeed, deleteComment, CommentDto } from '../../api/comment';

type ImageDto = { url: string; ord: number };
type P = {
  feedId: number;
  content?: string;
  images?: ImageDto[];
  ownerUsername?: string;
  likeCount?: number;
  isLiked?: boolean;
  commentCount?: number;
  mode:'MY' | 'USER';
};

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

export default function FeedDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, P>, string>>();
  const {
    feedId,
    content,
    images,
    username = 'unknown',
    likeCount: initLikeCount = 0,
    isLiked: initIsLiked = false,
    commentCount: initCommentCount = 0,
  } = (route.params || {}) as P;

  // 상태
  const [index, setIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const [isLiked, setIsLiked] = useState(initIsLiked);
  const [likeCount, setLikeCount] = useState(initLikeCount);

  // media 리스트
  const media = useMemo(() => {
    const arr = Array.isArray(images) ? images : [];
    return arr
      .slice()
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
      .map(m => {
        const raw = m.url;
        const url = absUrl(raw);
        return { url, isVideo: isVideoUrl(raw) };
      })
      .filter(m => !!m.url);
  }, [images]);

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
    if (showComments) {
      loadComments();
    }
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

  // 좋아요 토글 (로컬 optimistic)
  const handleToggleLike = () => {
    // TODO: API 연결 시 await toggleLike(feedId)
    setIsLiked(v => !v);
    setLikeCount(prev => (isLiked ? Math.max(prev - 1, 0) : prev + 1));
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
            // @ts-ignore
            (navigation as any).goBack();
          } catch (e: any) {
            Alert.alert('실패', e?.message ?? '삭제 중 오류가 발생했습니다.');
          }
        }
      }
    ]);
  };

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
            />
          ) : (
            <Image source={{ uri: current.url! }} style={s.media} resizeMode="cover" />
          )
        ) : (
          <View style={s.placeholder}>
            <Text style={{ color: '#9CA3AF' }}>미디어 없음</Text>
          </View>
        )}
      </View>

      {/* 하단 그라디언트로 가독성 확보 */}
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

      {/* 오른쪽 아이콘 (커뮤 화면 톤 맞춤) */}
      <View style={s.rightIcons}>
        {/* 댓글 버튼 */}
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setShowComments(true)}
          activeOpacity={0.85}
        >
          <Image
            source={require('../../assets/icon/comments.png')}
            style={s.icon}
            resizeMode="contain"
          />
          <Text style={s.iconCount}>{showComments ? comments.length : (comments.length || initCommentCount)}</Text>
        </TouchableOpacity>

        {/* 좋아요 버튼 (토글) */}
        <TouchableOpacity
          style={s.iconBtn}
          onPress={handleToggleLike}
          activeOpacity={0.85}
        >
          <Image
            source={
              isLiked
                ? require('../../assets/icon/heart-outline.png')
                : require('../../assets/icon/heart.png')
            }
            style={s.icon}
            resizeMode="contain"
          />
          <Text style={s.iconCount}>{likeCount}</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 콘텐츠 (유저/본문 + 썸네일 스트립) */}
      <View style={s.bottomContainer}>
        {/* 유저/본문 */}
        <View style={s.bottomText}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.username}>@{username}</Text>
            <TouchableOpacity style={s.followBtn} activeOpacity={0.85} onPress={() => Alert.alert('팔로우', '나중에 API 연결!')}>
              <Text style={s.followTxt}>팔로우</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                onPress={() => setIndex(i)}
                style={[s.thumbBox, i === index && s.thumbBoxActive]}
              >
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

      {/* 댓글 모달 (바텀시트 스타일) */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalContainer}
        >
          <TouchableOpacity
            style={s.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowComments(false)}
          />

          <View style={s.commentsSheet}>
            {/* 헤더 */}
            <View style={s.commentsHeader}>
              <Text style={s.commentsTitle}>댓글 {comments.length}개</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Text style={s.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 목록 */}
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
                    <Text style={s.commentDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={s.commentText}>{item.comment}</Text>

                  {/* 댓글 삭제 */}
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(item.id)}
                    style={s.deleteCommentBtn}
                  >
                    <Text style={s.deleteCommentTxt}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* 입력 */}
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
              <TouchableOpacity
                style={s.sendBtn}
                onPress={handleCreateComment}
                disabled={!commentText.trim()}
              >
                <Text style={[s.sendBtnTxt, !commentText.trim() && s.sendBtnDisabled]}>
                  전송
                </Text>
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

  // 미디어
  mediaWrap: { position: 'absolute', top: 0, left: 0, width, height, alignItems: 'center', justifyContent: 'center' },
  media: { width, height },
  placeholder: { width, height, alignItems: 'center', justifyContent: 'center' },

  // 하단 그라디언트
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },

  // 상단 바
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', zIndex: 10,
  },
  topBarInner: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 12,
  },
  topBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  topBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // 오른쪽 아이콘 (커뮤 톤)
  rightIcons: {
    position: 'absolute',
    right: 16,
    bottom: height * 0.25, // 커뮤 화면처럼 살짝 아래
    zIndex: 10,
    gap: 18,
  },
  iconBtn: { alignItems: 'center', padding: 10, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.5)' },
  icon: { width: 32, height: 32, tintColor: '#fff' },
  iconCount: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 4 },

  // 하단 컨텐츠 (유저/본문 + 썸네일)
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  bottomText: { paddingHorizontal: 12, paddingBottom: 8 },
  username: { fontSize: 18, fontWeight: '800', color: '#fff', marginRight: 8 },
  followBtn: { borderWidth: 1, borderColor: '#fff', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginLeft: 8 },
  followTxt: { fontSize: 12, color: '#fff' },

  contentWrapper: { maxHeight: height * 0.35 },
  contentToggle: { alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', marginTop: 6 },
  contentToggleTxt: { color: '#fff', fontSize: 12 },
  contentScroll: { maxHeight: height * 0.3 },
  contentScrollInner: { paddingHorizontal: 2, paddingBottom: 12 },
  contentTxt: { color: '#E5E7EB', fontSize: 15, lineHeight: 22 },

  // 썸네일 스트립
  thumbStrip: { maxHeight: 86, backgroundColor: 'rgba(0,0,0,0.35)' },
  thumbBox: { marginHorizontal: 4, borderRadius: 8, borderWidth: 2, borderColor: 'transparent' },
  thumbBoxActive: { borderColor: '#fff' },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#222' },

  // 댓글 모달
  modalContainer: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  commentsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  commentsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
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

  // 댓글 입력
  commentInputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1, maxHeight: 100, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#F3F4F6', borderRadius: 20, fontSize: 14, color: '#111827',
  },
  sendBtn: { marginLeft: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#587dc4' },
  sendBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  sendBtnDisabled: { opacity: 0.5 },
});
