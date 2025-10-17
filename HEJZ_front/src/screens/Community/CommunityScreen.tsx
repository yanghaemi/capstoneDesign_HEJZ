import React, { useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { height: screenHeight } = Dimensions.get('window');

const CommunityScreen = () => {
  const navigation = useNavigation();
  const [shorts, setShorts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const loadData = async () => {
        const blockList = await AsyncStorage.getItem('blockedUsers');
        const blockedIds = blockList ? JSON.parse(blockList) : [];

        const dummyData = [
          {
            id: '1',
            userId: 'user1',
            title: '양해미의 춤사위',
            prompt: 'MT에서 선배미 뿜뿜',
            likes: 24,
            bookmarked: false,
            comments: ['너무 재밌어요!', '이 영상 최고 ㅋㅋ'],
            videoUri: require('../../assets/Videos/video1.mp4'),
            followed: false,
          },
          {
            id: '2',
            userId: 'user2',
            title: '송영은의 마임쇼',
            prompt: '귀여움이 넘치는 캠퍼스 아이돌',
            likes: 45,
            bookmarked: false,
            comments: ['완전 귀여워요!', '이런 마임 더 보고 싶다'],
            videoUri: require('../../assets/Videos/video2.mp4'),
            followed: false,
          },
        ];

        const filtered = dummyData.filter((item) => !blockedIds.includes(item.userId));
        setShorts(filtered);
      };

      loadData();
    }, [])
  );

  const toggleLike = (id) => {
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

  const toggleBookmark = (id) => {
    setShorts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, bookmarked: !item.bookmarked } : item))
    );
  };

  const toggleFollow = (id) => {
    setShorts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, followed: !item.followed } : item))
    );
  };

  const addComment = (id, comment) => {
    setShorts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, comments: [...item.comments, comment] } : item
      )
    );
  };

  const handleBlockUser = async (id) => {
    const confirm = await new Promise((resolve) => {
      Alert.alert('차단 확인', '정말 이 사용자를 차단할까요?', [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: '차단', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
    if (!confirm) return;
    const existing = await AsyncStorage.getItem('blockedUsers');
    const parsed = existing ? JSON.parse(existing) : [];
    const updated = [...new Set([...parsed, id])];
    await AsyncStorage.setItem('blockedUsers', JSON.stringify(updated));
    setShorts((prev) => prev.filter((item) => item.userId !== id));
  };

  const handleReportUser = (id) => {
    Alert.alert('신고 완료', '신고가 접수되었습니다.');
  };

  const renderItem = ({ item }) => (
    <View style={styles.videoContainer}>
      <Video source={{ uri: item.videoUri }} style={styles.video} repeat resizeMode="cover" muted />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />

      <View style={styles.overlay}>
        <View style={styles.bottomTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.title}>{item.title}</Text>
            <TouchableOpacity onPress={() => toggleFollow(item.id)} style={styles.followButton}>
              <Text style={styles.followText}>{item.followed ? '팔로잉' : '팔로우'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.prompt}>{item.prompt}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => toggleLike(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={styles.actionRow}>
                  <Image
                    source={
                      item.liked
                        ? require('../../assets/icon/star.png')
                        : require('../../assets/icon/star-outline.png')
                    }
                    style={styles.icon}
                  />
                  <Text style={styles.count}>{item.likes}</Text>
                </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setSelectedId(item.id); setCommentModalVisible(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.actionRow}>
              <Image
                source={require('../../assets/icon/comments.png')}  // ← 파일명/경로 맞게
                style={styles.icon}                                 // 아이콘 스타일 재사용
                resizeMode="contain"
              />
              <Text style={styles.count}>{item.comments.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setSelectedId(item.userId);
            setModalVisible(true);
          }}>
            <Text style={styles.actionIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('MyRoom')}>
          <Image source={require('../../assets/icon/cat.png')} style={{ width: 50, height: 50, borderRadius: 25 }} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={shorts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />

      <Modal transparent visible={modalVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.popupContainer}>
            <TouchableOpacity onPress={() => {
              if (selectedId) handleBlockUser(selectedId);
              setModalVisible(false);
            }}>
              <Text style={styles.popupText}>차단</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              if (selectedId) handleReportUser(selectedId);
              setModalVisible(false);
            }}>
              <Text style={styles.popupText}>신고</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={commentModalVisible} animationType="slide">
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetBar} />
          <Text style={styles.commentHeader}>댓글</Text>
          <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
          <FlatList
            data={shorts.find((s) => s.id === selectedId)?.comments || []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.commentItem}>💬 {item}</Text>}
            style={styles.commentList}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
            style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              value={commentInput}
              onChangeText={setCommentInput}
              placeholder="댓글을 입력하세요"
            />
            <TouchableOpacity
              onPress={() => {
                if (selectedId && commentInput.trim()) {
                  addComment(selectedId, commentInput);
                  setCommentInput('');
                }
              }}>
              <Text style={styles.sendButton}>등록</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default CommunityScreen;

const styles = StyleSheet.create({
  videoContainer: {
    height: screenHeight,
    position: 'relative',
  },
  video: {
    height: '100%',
    width: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 80,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  prompt: {
    fontSize: 14,
    color: '#ccc',
  },
  followButton: {
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 8,
  },
  followText: {
    fontSize: 12,
    color: '#fff',
  },
  actionsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  profileButton: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: 200,
  },
  popupText: {
    fontSize: 16,
    paddingVertical: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: screenHeight * 0.6,
  },
  bottomSheetBar: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  commentHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentList: {
    marginBottom: 10,
  },
  commentItem: {
    fontSize: 14,
    paddingVertical: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    color: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  profileButton: {
      position: 'absolute',
      right: 16,
      bottom: 40, // 기존보다 아래로 내려서 겹치지 않게
      zIndex: 10,
    },
    closeButton: {
      position: 'absolute',
      top: 10,
      right: 20,
    },
    closeButtonText: {
      fontSize: 16,
      color: '#007AFF',
    },
    actionRow: {
        alignItems: 'center',
          justifyContent: 'center',
          minWidth: 36,               // RN 0.71+ 지원. 아니면 marginRight로 대체
    },
    icon: {
      width: 30,
      height: 30,
      // 단색 PNG면 브랜드 컬러로 물들이기 가능
      tintColor: '#587dc4',
    },
    count: {
      marginTop: 4,
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
    },
});
