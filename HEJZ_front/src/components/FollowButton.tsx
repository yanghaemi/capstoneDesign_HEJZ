// src/components/FollowButton.tsx - 완전 교체
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { followUser, unfollowUser } from '../api/follow';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  username: string;
  hideIfMe?: boolean;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
};

export default function FollowButton({ username, hideIfMe, initialFollowing = false, onFollowChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isMe, setIsMe] = useState(false);

  // 🔥 중요: initialFollowing 변경 시 상태 동기화
  useEffect(() => {
    console.log('[FollowButton] initialFollowing 업데이트:', initialFollowing);
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  // 내 username 확인
  useEffect(() => {
    (async () => {
      try {
        const myUsername = await AsyncStorage.getItem('user.username');
        console.log('[FollowButton] 본인 확인:', { myUsername, targetUsername: username });
        if (myUsername === username) {
          setIsMe(true);
        }
      } catch (e) {
        console.log('[FollowButton] username 확인 실패:', e);
      }
    })();
  }, [username]);

  const handlePress = async () => {
    console.log('[FollowButton] 버튼 클릭, 현재 상태:', isFollowing);
    setLoading(true);

    try {
      if (isFollowing) {
        console.log('[FollowButton] 언팔로우 API 호출');
        await unfollowUser(username);
        setIsFollowing(false);
        console.log('[FollowButton] 언팔로우 성공, 상태 업데이트');
        onFollowChange?.(false);
        Alert.alert('언팔로우 완료', `@${username}님을 언팔로우했습니다.`);
      } else {
        console.log('[FollowButton] 팔로우 API 호출');
        await followUser(username);
        setIsFollowing(true);
        console.log('[FollowButton] 팔로우 성공, 상태 업데이트');
        onFollowChange?.(true);
        Alert.alert('팔로우 완료', `@${username}님을 팔로우했습니다.`);
      }
    } catch (err: any) {
      console.log('[FollowButton] API 에러:', err.message);
      Alert.alert('오류', err.message ?? '팔로우 처리 실패');
    } finally {
      setLoading(false);
    }
  };

  // 본인이면 숨김
  if (hideIfMe && isMe) {
    console.log('[FollowButton] 본인 프로필이므로 버튼 숨김');
    return null;
  }

  console.log('[FollowButton] 렌더링:', { username, isFollowing, loading });

  return (
    <TouchableOpacity
      style={[s.btn, isFollowing ? s.btnFollowing : s.btnFollow]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? '#587dc4' : '#fff'} />
      ) : (
        <Text style={[s.btnText, isFollowing ? s.btnTextFollowing : s.btnTextFollow]}>
          {isFollowing ? '팔로잉' : '팔로우'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFollow: {
    backgroundColor: '#587dc4',
  },
  btnFollowing: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextFollow: {
    color: '#FFFFFF',
  },
  btnTextFollowing: {
    color: '#6B7280',
  },
});