// src/components/FollowButton.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { amIFollowing, follow as followApi, unfollow as unfollowApi } from '../api/follow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SK } from '../api/user';

type Props = {
  username: string;
  size?: 'sm' | 'md';
  hideIfMe?: boolean; // true면 자기 자신일 때 버튼 숨김
};

export default function FollowButton({ username, size = 'md', hideIfMe = true }: Props) {
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // 내 username 가져오기 (AsyncStorage 캐시)
  useEffect(() => {
    (async () => {
      try {
        const myU = (await AsyncStorage.getItem(SK.username)) || null;
        setMe(myU);
      } catch {
        setMe(null);
      }
    })();
  }, []);

  // 초기 팔로잉 상태 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const yes = await amIFollowing(username).catch(() => false);
        if (alive) setIsFollowing(yes);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [username]);

  const isMe = me && me === username;
  const btnStyle = useMemo(() => {
    const base = [s.btn, size === 'sm' ? s.sm : s.md];
    if (isFollowing) base.push(s.on);
    return base;
  }, [isFollowing, size]);

  if (hideIfMe && isMe) return null;

  const onPress = async () => {
    if (toggling || loading || !username) return;
    setToggling(true);
    const prev = isFollowing;
    try {
      // 낙관적 업데이트
      setIsFollowing(!prev);
      if (!prev) await followApi(username);
      else await unfollowApi(username);
    } catch {
      // 롤백
      setIsFollowing(prev);
    } finally {
      setToggling(false);
    }
  };

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} activeOpacity={0.85} disabled={toggling || loading || isMe}>
      {toggling || loading ? (
        <ActivityIndicator size="small" color={isFollowing ? '#111827' : '#fff'} />
      ) : (
        <Text style={[s.label, isFollowing ? s.labelOn : s.labelOff]}>
          {isFollowing ? '팔로잉' : '팔로우'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: 10,
    backgroundColor: '#587dc4',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sm: { height: 34 },
  md: { height: 40 },
  on: {
    backgroundColor: '#E5E7EB',
  },
  label: { fontWeight: '800' },
  labelOff: { color: '#fff' },
  labelOn: { color: '#111827' },
});
