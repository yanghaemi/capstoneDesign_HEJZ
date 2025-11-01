// src/screens/UserRoomScreen.tsx  (요약된 풀파일; 기존 버전에서 API 의존 부분 제거/완화)
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  Dimensions, TouchableOpacity, StatusBar, ActivityIndicator
} from 'react-native';
import { BASE_URL } from '../../api/baseUrl';
import FollowButton from '../../components/FollowButton';

const { width } = Dimensions.get('window');
const COLS = 3; const GAP = 4; const H_PADDING = 12;
const THUMB = Math.floor((width - GAP * (COLS - 1) - H_PADDING * 2) / COLS);
const TAB_H = 66;

type FeedItem = {
  id: number;
  content?: string | null;
  images?: { url: string; ord?: number; type?: string }[];
  media?: { url: string; ord?: number; type?: string }[];
  userId?: number;
  username?: string;
  authorUsername?: string;
  nickname?: string;
  authorNickname?: string;
  user?: { username?: string; nickname?: string; avatarUrl?: string; profileImageUrl?: string };
};

function absUrl(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`;
}
function isVideoUrl(u?: string | null) {
  if (!u) return false;
  return /\.(mp4|mov|m4v|webm|3gp)$/i.test(u);
}
function fmtDur(sec?: number | null) {
  if (sec === undefined || sec === null) return null;
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function UserRoomScreen({ navigation, route }: any) {
  const { username: inUsername, userId, seedPosts = [] } = route.params ?? {};
  const [username, setUsername] = useState<string | undefined>(inUsername);
  const [nickname, setNickname] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<FeedItem[]>([]);

  // 1) seedPosts에서 해당 작성자의 정보 추출
  useEffect(() => {
    const arr: FeedItem[] = Array.isArray(seedPosts) ? seedPosts : [];
    setItems(
      arr.map((it) => ({
        ...it,
        images: Array.isArray(it?.images)
          ? it.images
          : Array.isArray(it?.media)
          ? it.media.map((m: any) => ({ url: m.url, ord: m.ord, type: m.type }))
          : [],
      }))
    );

    // username
    const u =
      inUsername ||
      arr.find(p => typeof p?.username === 'string' && p.username)?.username ||
      arr.find(p => typeof p?.authorUsername === 'string' && p.authorUsername)?.authorUsername ||
      arr.find(p => typeof p?.user?.username === 'string' && p.user.username)?.user?.username ||
      undefined;
    if (u) setUsername(u);

    // nickname
    const n =
      arr.find(p => typeof p?.nickname === 'string' && p.nickname)?.nickname ||
      arr.find(p => typeof p?.authorNickname === 'string' && p.authorNickname)?.authorNickname ||
      arr.find(p => typeof p?.user?.nickname === 'string' && p.user.nickname)?.user?.nickname ||
      u || // fallback
      undefined;
    if (n) setNickname(n);

    // avatar
    const a =
      arr.find(p => p?.user?.avatarUrl)?.user?.avatarUrl ||
      arr.find(p => p?.user?.profileImageUrl)?.user?.profileImageUrl ||
      undefined;
    if (a) setAvatarUrl(a);
  }, [inUsername, seedPosts]);

  const gridItem = ({ item }: { item: FeedItem }) => {
    const raw = item.images?.[0]?.url ?? item.media?.[0]?.url ?? null;
    const uri = absUrl(raw);
    const video = isVideoUrl(raw);
    const duration = fmtDur((item as any).videoDurationSec ?? (item as any).durationSec ?? (item as any).duration);

    return (
      <TouchableOpacity
        style={s.gridItem}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('FeedDetail', {
            feedId: item.id,
            content: item.content,
            images: item.images,
          })
        }
      >
        {uri ? (
          <>
            <Image source={{ uri }} style={s.thumbImg} />
            <View style={s.overlayBottom}>
              {duration ? <Text style={s.durText}>{duration}</Text> : <View />}
              {video ? <Text style={s.playBadge}>▶</Text> : null}
            </View>
          </>
        ) : (
          <View style={[s.thumbImg, s.thumbFallback]}>
            <Text numberOfLines={3} style={s.noImgText}>
              {item.content || '(내용 없음)'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const avatar = absUrl(avatarUrl) ?? 'https://picsum.photos/200/200';
  const worksCount = items.length;

  return (
    <View style={s.screen}>
      <SafeAreaView />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* AppBar */}
      <View style={s.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.back}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={s.title}>@{username ?? (userId != null ? `userId:${userId}` : 'user')}</Text>
        <View style={{ width: 18 }} />
      </View>

      {/* Profile Header (옵션/편집 버튼 제거, Follow만) */}
      <View style={s.profileWrap}>
        <View style={s.profileRow}>
          <Image source={{ uri: avatar }} style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.nickname}>{nickname ?? username ?? '사용자'}</Text>
            <Text style={s.meta}>Works {worksCount}</Text>
          </View>

          {/* username을 알아야 follow가 가능 → 알면 노출, 없으면 숨김 */}
          {username ? <FollowButton username={username} hideIfMe /> : null}
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={gridItem}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: H_PADDING }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: TAB_H + 10 }}
        ListFooterComponent={<Text style={s.footer}>끝이에요</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  appbar: {
    height: 56, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { fontSize: 26, color: '#111827' },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: 0.3, color: '#0B1020' },

  profileWrap: {
    paddingHorizontal: H_PADDING, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 70, height: 70, borderRadius: 30, backgroundColor: '#E5E7EB' },
  nickname: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 4 },

  gridItem: { width: THUMB, height: THUMB, backgroundColor: '#FFF', borderRadius: 10, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: 8 },
  noImgText: { fontSize: 11, color: '#E5E7EB', textAlign: 'center' },

  overlayBottom: {
    position: 'absolute', left: 6, right: 6, bottom: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  durText: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' },
  playBadge: { fontSize: 12, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' },

  footer: { textAlign: 'center', color: '#6B7280', paddingVertical: 10 },
});
