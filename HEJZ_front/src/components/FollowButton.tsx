import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useFollow } from '../hooks/useFollow';

export default function FollowButton({ username, initialFollowing }:{
  username: string; initialFollowing?: boolean;
}) {
  const { following, loading, toggle } = useFollow(username, initialFollowing);

  if (loading) return <ActivityIndicator />;

  return (
    <TouchableOpacity
      onPress={toggle}
      style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
        backgroundColor: following ? '#eee' : '#111',
      }}>
      <Text style={{ color: following ? '#111' : '#fff', fontWeight: '700' }}>
        {following ? '팔로잉' : '팔로우'}
      </Text>
    </TouchableOpacity>
  );
}
