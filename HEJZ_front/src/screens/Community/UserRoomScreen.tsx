// src/screens/UserRoomScreen.tsx  — 최종본 (프론트만으로 미리보기 보장)
import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  Dimensions, TouchableOpacity, StatusBar, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../api/baseUrl';

// ===== feed API (named/default 안전 호출) =====
import FeedApiDefault, * as FeedApiNS from '../../api/feed';
const fetchUserFeedsSafe =
  (FeedApiNS as any).fetchUserFeeds ?? (FeedApiDefault as any)?.fetchUserFeeds;

// ===== user API =====
import UserApiDefault, * as UserApiNS from '../../api/user';
const fetchUserPublicByUsernameSafe =
  (UserApiNS as any).fetchUserPublicByUsername ?? (UserApiDefault as any)?.fetchUserPublicByUsername;
const fetchUserInfoByIdSafe =
  (UserApiNS as any).fetchUserInfoById ?? (UserApiDefault as any)?.fetchUserInfoById;

// ===== follow =====
import FollowButton from '../../components/FollowButton';

// ===== assets =====
const USTAR_BLACK = (() => { try { return require('../../assets/icon/U-STAR_black.png'); } catch { return null; } })();
const ICON_SEARCH = (() => { try { return require('../../assets/icon/search.png'); } catch { return null; } })();
const ICON_MUSIC  = (() => { try { return require('../../assets/icon/music.png'); } catch { return null; } })();
const ICON_SHORT  = (() => { try { return require('../../assets/icon/short.png'); } catch { return null; } })();
const ICON_DANCE  = (() => { try { return require('../../assets/icon/dance.png'); } catch { return null; } })();

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 4;
const H_PADDING = 12;
const THUMB = Math.floor((width - GAP * (COLS - 1) - H_PADDING * 2) / COLS);
const TAB_H = 66;

type FeedItemDto = {
  id: number;
  content?: string | null;
  images?: { url?: string | null; ord?: number; type?: string }[];
  media?: { url?: string | null; ord?: number; type?: string }[];
  videoDurationSec?: number;
  durationSec?: number;
  duration?: number;
};
type Profile = {
  id?: number;
  username: string;
  nickname: string;
  bio?: string | null;
  avatarUrl?: string | null;
  followers?: number;
  following?: number;
};

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

/** 상대/이상한 URL 정리 → 절대 URL 또는 null */
function normalizeAbsUrl(u?: string | null) {
  if (!u) return null;
  const t = String(u).trim();
  if (!t || t === '/' || t === '#' || t === 'null' || t === 'undefined') return null;
  return /^https?:\/\//i.test(t) ? t : `${BASE_URL}${t.startsWith('/') ? '' : '/'}${t}`;
}

/** 썸네일: URL 없거나 로딩 실패 시 텍스트 타일로 폴백 */
function GridThumb({
  rawUrl,
  text,
  isVideo,
  duration,
}: {
  rawUrl?: string | null;
  text?: string | null;
  isVideo?: boolean;
  duration?: string | null;
}) {
  const [failed, setFailed] = React.useState(false);
  const uri = normalizeAbsUrl(rawUrl);

  if (!uri || failed) {
    return (
      <View style={[s.thumbImg, s.thumbFallback]}>
        <Text numberOfLines={3} style={s.noImgText}>{text || '(내용 없음)'}</Text>
      </View>
    );
  }

  return (
    <>
      <Image source={{ uri }} style={s.thumbImg} onError={() => setFailed(true)} />
      <View style={s.overlayBottom}>
        {duration ? <Text style={s.durText}>{duration}</Text> : <View />}
        {isVideo ? <Text style={s.playBadge}>▶</Text> : null}
      </View>
    </>
  );
}

export default function UserRoomScreen({ navigation, route }: any) {
  const params = route?.params || {};
  const [user, setUser] = useState<Profile | null>(null);
  const [isMe, setIsMe] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(params.followers ?? 0);
  const [followingCount, setFollowingCount] = useState<number>(params.following ?? 0);

  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const didInitRef = useRef(false);
  const loadingRef = useRef(false);
  const lastCursorRef = useRef<string | null>(null);
  const onEndGuardRef = useRef(false);
  const lastPageTsRef = useRef(0);
  const now = () => Date.now();

  // 초기 로드: 프로필 → 피드
  useFocusEffect(
    useCallback(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;

      const loadProfile = async () => {
        // 1) route seed
        const seed: Profile | null = params
          ? {
              id: params.userId,
              username: params.username ?? '',
              nickname: params.nickname ?? (params.username ?? ''),
              bio: params.bio ?? '',
              avatarUrl: params.avatarUrl ?? null,
              followers: params.followers ?? 0,
              following: params.following ?? 0,
            }
          : null;
        if (seed && (seed.username || seed.nickname)) {
          setUser(seed);
          setFollowerCount(seed.followers ?? 0);
          setFollowingCount(seed.following ?? 0);
        }

        // 2) 서버 조회 (username 우선 → userId)
        let prof: Profile | null = null;
        try {
          if (params.username && fetchUserPublicByUsernameSafe) {
            const p = await fetchUserPublicByUsernameSafe(params.username);
            if (p) {
              prof = {
                id: p.id,
                username: p.username,
                nickname: p.nickname ?? p.username,
                bio: p.bio ?? '',
                avatarUrl: p.avatarUrl ?? p.profileImageUrl ?? null,
                followers: p.followers ?? seed?.followers ?? 0,
                following: p.following ?? seed?.following ?? 0,
              };
            }
          } else if (params.userId && fetchUserInfoByIdSafe) {
            const p = await fetchUserInfoByIdSafe(params.userId);
            if (p) {
              prof = {
                id: p.id,
                username: p.username,
                nickname: p.nickname ?? p.username,
                bio: p.bio ?? '',
                avatarUrl: p.avatarUrl ?? p.profileImageUrl ?? null,
                followers: p.followers ?? seed?.followers ?? 0,
                following: p.following ?? seed?.following ?? 0,
              };
            }
          }
        } catch (e: any) {
          console.log('[UserRoom] profile fetch fail:', e?.message);
        }

        if (prof) {
          setUser(prof);
          setFollowerCount(prof.followers ?? 0);
          setFollowingCount(prof.following ?? 0);
        }

        // 3) 내/남 판별
        try {
          const myU = await AsyncStorage.getItem('user.username');
          const targetU = (prof ?? seed)?.username;
          setIsMe(!!myU && !!targetU && myU === targetU);
        } catch {}
      };

      (async () => {
        await loadProfile();
        await load(true);
      })();
    }, [params])
  );

  // 피드 로드 (username 기반)
  const load = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    const uname = user?.username ?? params.username;
    if (!uname) return;

    loadingRef.current = true;
    setIsLoading(true);
    try {
      if (!fetchUserFeedsSafe) throw new Error('fetchUserFeeds API 없음');

      const cur = reset ? null : cursor;
      if (!reset && lastCursorRef.current === cur) return;

      const data = await fetchUserFeedsSafe(uname, 24, cur ?? undefined);

      const feedArray = Array.isArray(data?.items) ? data.items :
                        Array.isArray(data?.feeds) ? data.feeds :
                        Array.isArray(data) ? data : [];

      // 미디어 url 정리 + ord 정렬 (비정상 url은 null 처리되어 폴백으로 감)
      const safe: FeedItemDto[] = feedArray.map((it: any) => {
        const media = Array.isArray(it?.images) ? it.images
                    : Array.isArray(it?.media) ? it.media
                    : [];
        const fixed = media
          .slice()
          .sort((a: any, b: any) => (a?.ord ?? 0) - (b?.ord ?? 0))
          .map((m: any) => ({ ...m, url: normalizeAbsUrl(m?.url) }));
        return { ...it, images: fixed };
      });

      if (reset) setItems(safe);
      else setItems(prev => [...prev, ...safe]);

      const nextCur = data?.nextCursor ?? null;
      setCursor(nextCur);
      setHasMore(Boolean(nextCur));
      lastCursorRef.current = nextCur;
    } catch (e: any) {
      Alert.alert('알림', e?.message ?? '요청 실패');
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [cursor, user?.username, params.username]);

  const onRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    try {
      lastCursorRef.current = null;
      setCursor(null);
      setHasMore(true);
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const onEndReached = useCallback(() => {
    if (onEndGuardRef.current) return;
    onEndGuardRef.current = true;
    if (!hasMore || loadingRef.current) return;

    const lastTs = lastPageTsRef.current;
    if (now() - lastTs < 1200) return;
    lastPageTsRef.current = now();

    load(false);
  }, [hasMore, load]);

  const onMomentumScrollBegin = useCallback(() => {
    onEndGuardRef.current = false;
  }, []);

  const renderItem = ({ item }: { item: FeedItemDto }) => {
    const raw = item.images?.[0]?.url ?? item.media?.[0]?.url;
    const video = isVideoUrl(raw);
    const duration = fmtDur(item.videoDurationSec ?? item.durationSec ?? item.duration);

    return (
      <TouchableOpacity
        style={[s.gridItem, s.gridBorder]}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('FeedDetail', {
            feedId: item.id,
            content: item.content,
            images: item.images,
          })
        }
      >
        <GridThumb rawUrl={raw} text={item.content ?? ''} isVideo={video} duration={duration} />
      </TouchableOpacity>
    );
  };

  const username = user?.username ?? params.username ?? 'username';
  const nickname = user?.nickname ?? params.nickname ?? username;
  const bio = user?.bio ?? params.bio ?? '';
  const avatarUri = normalizeAbsUrl(user?.avatarUrl ?? params.avatarUrl) ?? 'https://picsum.photos/200/200';

  return (
    <View style={s.screen}>
      <SafeAreaView />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* AppBar */}
      <View style={s.appbar}>
        <View style={s.appbarLeft}>
          {USTAR_BLACK ? (
            <Image source={USTAR_BLACK} resizeMode="contain" style={s.logo} />
          ) : (
            <View style={[s.logo, { backgroundColor: '#eee' }]} />
          )}
          <Text style={s.title}>{username}</Text>
        </View>
        <View style={s.appbarRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search', { screen: 'search' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={s.iconBtn}
            activeOpacity={0.8}
          >
            {ICON_SEARCH ? (
              <Image source={ICON_SEARCH} style={s.rightIcon} resizeMode="contain" />
            ) : (
              <View style={[s.rightIcon, { backgroundColor: '#eee', borderRadius: 999 }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header */}
      <View style={s.profileWrap}>
        <View style={s.profileRow}>
          <Image source={{ uri: avatarUri }} style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.nickname}>{nickname}</Text>
            <Text style={s.meta}>팔로워 {followerCount} · 팔로잉 {followingCount} · Works {items.length}</Text>
          </View>
          {isMe ? null : (
            <FollowButton
              username={username}
              onFollowChange={(following) => {
                setFollowerCount((v) => Math.max(0, v + (following ? 1 : -1))); // 즉시 반영
              }}
            />
          )}
        </View>
        {bio ? <Text style={s.bio} numberOfLines={2}>{bio}</Text> : null}
      </View>

      {/* Grid */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        renderItem={renderItem}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: H_PADDING }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: TAB_H + 10 }}
        onEndReachedThreshold={0.6}
        onEndReached={onEndReached}
        onMomentumScrollBegin={onMomentumScrollBegin}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={
          !hasMore ? <Text style={s.footer}>끝이에요</Text> :
          isLoading ? <Text style={s.footer}>불러오는 중…</Text> : null
        }
      />

      {/* (선택) 하단 탭 — 필요 없으면 제거 */}
      <View style={s.tabbar}>
        <TabImg src={ICON_MUSIC} onPress={() => navigation.navigate('Music')} />
        <TabImg src={ICON_SHORT} onPress={() => navigation.navigate('Community', { screen: 'Community' })} />
        <TabImg src={ICON_DANCE} onPress={() => navigation.navigate('Dance', { screen: 'DanceScreen' })} />
      </View>
    </View>
  );
}

function TabImg({ src, onPress }: { src: any; onPress: () => void }) {
  if (!src) return <View style={s.tabItem}><View style={[s.tabIconImg, { backgroundColor: '#eee' }]} /></View>;
  return (
    <TouchableOpacity style={s.tabItem} onPress={onPress} activeOpacity={0.85}>
      <Image source={src} style={s.tabIconImg} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  appbar: {
    height: 56, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  appbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  rightIcon: { width: 22, height: 22 },
  logo: { width: 60, height: 60 },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: 0.4, color: '#0B1020' },

  profileWrap: {
    paddingHorizontal: H_PADDING, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 70, height: 70, borderRadius: 30, backgroundColor: '#E5E7EB' },
  nickname: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  bio: { marginTop: 10, marginLeft: 20, marginRight: 12, fontSize: 15, color: '#374151' },

  // Grid cell (MyRoom 톤 + 테두리)
  gridItem: {
    width: THUMB, height: THUMB,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridBorder: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  thumbImg: { width: '100%', height: '100%' },
  thumbFallback: {
    backgroundColor: '#0F172A', // 텍스트 타일 배경 (MyRoom과 동일)
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  noImgText: { fontSize: 12, color: '#E5E7EB', textAlign: 'center' },

  overlayBottom: {
    position: 'absolute', left: 6, right: 6, bottom: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  durText: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' },
  playBadge: { fontSize: 12, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' },

  footer: { textAlign: 'center', color: '#6B7280', paddingVertical: 10 },

  tabbar: {
    position: 'absolute', left: -15, right: 20, bottom: 0, height: TAB_H,
    backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: width / 3 },
  tabIconImg: { width: 34, height: 34 },
});
