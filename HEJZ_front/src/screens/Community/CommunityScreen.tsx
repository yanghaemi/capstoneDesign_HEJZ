import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';

// 타입 정의
type ShortsItem = {
  id: string;
  title: string;
  likes: number;
  liked: boolean;
  comments: string[];
};

const CommunityScreen = ({ navigation }: any) => {
  const [shorts, setShorts] = useState<ShortsItem[]>([]);
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  // 더미 데이터 초기화
  useEffect(() => {
    const dummyData: ShortsItem[] = [
      { id: '1', title: '감성 힙합 숏츠', likes: 24, liked: false, comments: [] },
      { id: '2', title: '파워 댄스 숏츠', likes: 45, liked: false, comments: [] },
      { id: '3', title: '감정 댄스 영상', likes: 12, liked: false, comments: [] },
    ];
    setShorts(dummyData);
  }, []);

  // 좋아요 토글
  const toggleLike = (id: string) => {
    setShorts((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              liked: !item.liked,
              likes: item.liked ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
    );
  };

  // 댓글 추가
  const addComment = (id: string, comment: string) => {
    setShorts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, comments: [...item.comments, comment] } : item
      )
    );
  };

  // 항목 렌더링
  const renderItem = ({ item }: { item: ShortsItem }) => (
    <View style={styles.shortsItem}>
      <View style={styles.thumbnail} />
      <Text style={styles.shortsTitle}>{item.title}</Text>

      <View style={styles.metaRow}>
        <TouchableOpacity onPress={() => toggleLike(item.id)}>
          <Text style={styles.metaText}>{item.liked ? '💖' : '🤍'} {item.likes}</Text>
        </TouchableOpacity>

        <Text style={styles.metaText}>💬 {item.comments.length}</Text>
      </View>

      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          value={commentInput[item.id] || ''}
          onChangeText={(text) => setCommentInput((prev) => ({ ...prev, [item.id]: text }))}
          placeholder="댓글을 입력하세요"
        />
        <TouchableOpacity
          onPress={() => {
            const text = commentInput[item.id]?.trim();
            if (text) {
              addComment(item.id, text);
              setCommentInput((prev) => ({ ...prev, [item.id]: '' }));
            }
          }}
        >
          <Text style={styles.commentSubmit}>등록</Text>
        </TouchableOpacity>
      </View>

      {item.comments.length > 0 && (
        <View style={styles.commentBox}>
          {item.comments.map((c, idx) => (
            <Text key={idx} style={styles.commentText}>• {c}</Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>사람들이 올린 숏츠</Text>

      <FlatList
        data={shorts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* 하단 네비게이션 바 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Select')}>
          <Text style={styles.navButton}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Feeds')}>
          <Text style={styles.navButton}>마이페이지</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CommunityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  listContainer: {
    paddingBottom: 120,
  },
  shortsItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginBottom: 10,
  },
  shortsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#000',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#555',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  commentSubmit: {
    fontSize: 14,
    color: '#4B9DFE',
    fontWeight: '500',
  },
  commentBox: {
    marginTop: 8,
  },
  commentText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  navButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B9DFE',
  },
});