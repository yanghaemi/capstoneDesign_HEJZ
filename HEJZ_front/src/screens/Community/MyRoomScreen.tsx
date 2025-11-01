import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  Dimensions, TouchableOpacity, StatusBar, Alert, RefreshControl,
} from 'react-native';
import {  useFocusEffect, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../api/baseUrl';

// ===== feed API (default / named 어떤 export든 안전하게) =====
import FeedApiDefault, * as FeedApiNS from '../../api/feed';
const fetchMyFeedsSafe =
  (FeedApiNS as any).fetchMyFeeds ?? (FeedApiDefault as any)?.fetchMyFeeds;
const deleteFeedSafe =
  (FeedApiNS as any).deleteFeed ?? (FeedApiDefault as any)?.deleteFeed;

// ===== user API (default / named 어떤 export든 안전하게) =====
import UserApiDefault, * as UserApiNS from '../../api/user';
const fetchMyProfileSafe =
  (UserApiNS as any).fetchMyProfile ?? (UserApiDefault as any)?.fetchMyProfile;

// ===== follow (fetch 기반) =====
import FollowButton from '../../components/FollowButton';
import { getFollowers, getFollowings } from '../../api/follow';

// ====== assets (require + null 가드) ======
const USTAR_BLACK = (() => { try { return require('../../assets/icon/U-STAR_black.png'); } catch { return null; } })();
const ICON_MUSIC  = (() => { try { return require('../../assets/icon/music.png'); } catch { return null; } })();
const ICON_SHORT  = (() => { try { return require('../../assets/icon/short.png'); } catch { return null; } })();
const ICON_DANCE  = (() => { try { return require('../../assets/icon/dance.png'); } catch { return null; } })();
const ICON_SEARCH = (() => { try { return require('../../assets/icon/search.png'); } catch { return null; } })();
const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 4;
const H_PADDING = 12;
const THUMB = Math.floor((width - GAP * (COLS - 1) - H_PADDING * 2) / COLS);
const TAB_H = 66;

type RouteP = RouteProp<
  Record<string, {
    username?: string;
    nickname?: string;
    bio?: string;
    avatarUrl?: string | null;
    followers?: number;
    following?: number;
  }>,
  string
>;

type FeedItemDto = {
  id: number;
  content?: string | null;
  images?: { url: string; ord?: number }[];
  videoDurationSec?: number;
  durationSec?: number;
  duration?: number;
};

type Profile = {
  username: string;
  nickname: string;
  bio?: string | null;
  avatarUrl?: string | null;
  followers?: number;
  following?: number;
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

// ===== AsyncStorage keys =====
const SK = {
  username: 'user.username',
  nickname: 'user.nickname',
  bio: 'user.bio',
  avatarUrl: 'user.avatarUrl',
  followers: 'user.followers',
  following: 'user.following',
} as const;

export default function MyProfileScreen({navigation, route}:any) {


  // === 프로필 상태 (route → API → local 순서로 채움)
  const [me, setMe] = useState<Profile | null>(null);

  // === 내/남 프로필 분기 & 카운트
  const [isMe, setIsMe] = useState<boolean>(true);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);

  // === 피드 상태
  const [items, setItems] = useState<FeedItemDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // guards
  const didInitRef = useRef(false);
  const loadingRef = useRef(false);
  const lastCursorRef = useRef<string | null>(null);
  const onEndGuardRef = useRef(false);
  const lastPageTsRef = useRef(0);
  const now = () => Date.now();

  // ===== 초기 로드: 프로필 → 카운트 → 피드 =====
  useFocusEffect(
    useCallback(() => {
      if (didInitRef.current) return;
      didInitRef.current = true;

      const loadProfile = async () => {
        // 1) route.params 우선
        const fromParams: Profile | null = route.params
          ? {
              username: route.params.username ?? '',
              nickname: route.params.nickname ?? '',
              bio: route.params.bio ?? '',
              avatarUrl: route.params.avatarUrl ?? null,
              followers: route.params.followers ?? 0,
              following: route.params.following ?? 0,
            }
          : null;

        if (fromParams && (fromParams.username || fromParams.nickname)) {
          setMe(fromParams);
        }

        // 2) /me API 시도
        let mapped: Profile | null = null;
        try {
          if (!fetchMyProfileSafe) throw new Error('fetchMyProfile API 없음');
          const p = await fetchMyProfileSafe();
          mapped = {
            username: p?.username ?? fromParams?.username ?? 'username',
            nickname: p?.nickname ?? fromParams?.nickname ?? 'nickname',
            bio: p?.bio ?? fromParams?.bio ?? '',
            avatarUrl: p?.avatarUrl ?? fromParams?.avatarUrl ?? null,
            followers: p?.followers ?? fromParams?.followers ?? 0,
            following: p?.following ?? fromParams?.following ?? 0,
          };
          setMe(mapped);

          // 캐시 저장 (실패 무시)
          await AsyncStorage.multiSet([
            [SK.username, mapped.username ?? ''],
            [SK.nickname, mapped.nickname ?? ''],
            [SK.bio, mapped.bio ?? ''],
            [SK.avatarUrl, mapped.avatarUrl ?? ''],
            [SK.followers, String(mapped.followers ?? 0)],
            [SK.following, String(mapped.following ?? 0)],
          ]);
        } catch (e: any) {
          console.log('fetchMyProfile failed:', e?.message);
        }

        // 3) API 실패 시 AsyncStorage fallback
        if (!mapped) {
          try {
            const [u, n, b, a, f1, f2] = await AsyncStorage.multiGet([
              SK.username, SK.nickname, SK.bio, SK.avatarUrl, SK.followers, SK.following
            ]);
            mapped = {
              username: (u?.[1] || fromParams?.username || 'username'),
              nickname: (n?.[1] || fromParams?.nickname || 'nickname'),
              bio: (b?.[1] ?? fromParams?.bio ?? ''),
              avatarUrl: (a?.[1] || fromParams?.avatarUrl || null),
              followers: Number(f1?.[1] ?? fromParams?.followers ?? 0),
              following: Number(f2?.[1] ?? fromParams?.following ?? 0),
            };
            setMe(mapped);
          } catch {}
        }

        // 4) 내/남 프로필 판별 + 카운트 갱신
        if (mapped) {
          try {
            const myU = (await AsyncStorage.getItem(SK.username)) || mapped.username;
            const targetU = route.params?.username || mapped.username;
            const itsMe = myU === targetU;
            setIsMe(itsMe);

            if (itsMe) {
              // 내 프로필이면 서버에서 최신 카운트
              const [followersList, followingsList] = await Promise.all([
                getFollowers().catch(() => []),
                getFollowings().catch(() => []),
              ]);
              setFollowerCount(followersList.length);
              setFollowingCount(followingsList.length);
            } else {
              // 남의 프로필이면 파라미터 or mapped 값 사용
              setFollowerCount(route.params?.followers ?? (mapped.followers ?? 0));
              setFollowingCount(route.params?.following ?? (mapped.following ?? 0));
            }
          } catch {
            setFollowerCount(mapped.followers ?? 0);
            setFollowingCount(mapped.following ?? 0);
          }
        }
      };

      (async () => {
        await loadProfile();
        await load(true);
      })();
    }, [route.params])
  );

  // ===== 피드 로드 =====
  const load = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      if (!fetchMyFeedsSafe) throw new Error('fetchMyFeeds API 없음');

      const cur = reset ? null : cursor;
      if (!reset && lastCursorRef.current === cur) return;

      const data = await fetchMyFeedsSafe({ limit: 24, cursor: cur });
      const safe: FeedItemDto[] = (data?.items ?? []).map((it: any) => ({
        ...it,
        images: Array.isArray(it?.images) ? it.images : [],
      }));

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
  }, [cursor]);

  const onRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    try {
      lastCursorRef.current = null;
      setCursor(null);
      setHasMore(true);

      // 내 프로필일 때 카운트도 리프레시
      if (isMe) {
        const [followersList, followingsList] = await Promise.all([
          getFollowers().catch(() => []),
          getFollowings().catch(() => []),
        ]);
        setFollowerCount(followersList.length);
        setFollowingCount(followingsList.length);
      }

      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load, isMe]);

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

  const handleLongPressDelete = (feedId: number) => {
    Alert.alert('삭제할까요?', '이 피드를 삭제합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!deleteFeedSafe) throw new Error('deleteFeed API 없음');
            await deleteFeedSafe(feedId);
            setItems(prev => prev.filter(f => f.id !== feedId));
          } catch (e: any) {
            Alert.alert('알림', e?.message ?? '삭제 실패');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: FeedItemDto }) => {
    const raw = item.images?.[0]?.url;
    const uri = absUrl(raw);
    const video = isVideoUrl(raw);
    const duration = fmtDur(item.videoDurationSec ?? item.durationSec ?? item.duration);

    return (
      <TouchableOpacity
        style={s.gridItem}
        activeOpacity={0.9}
        onPress={() =>
          (navigation as any).navigate('FeedDetail', {
            feedId: item.id,
            content: item.content,
            images: item.images,
          })
        }
        onLongPress={() => handleLongPressDelete(item.id)}
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

  // 표시용 안전값
  const username = me?.username ?? 'username';
  const nickname = me?.nickname ?? 'nickname';
  const bio = me?.bio ?? '';
  const avatarUri = absUrl(me?.avatarUrl) ?? 'https://picsum.photos/200/200';

  return (
    <View style={s.screen}>
      <SafeAreaView />
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* AppBar: username 표시 */}
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
              onPress={() => (navigation as any).navigate('Search', { screen: 'search' })}
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

            <TouchableOpacity
              onPress={() => (navigation as any).navigate('MyPageOptions')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={s.iconBtn}
              activeOpacity={0.8}
            >
              <Text style={s.burger}>≡</Text>
            </TouchableOpacity>
          </View>
      </View>


      {/* Profile */}
      <View style={s.profileWrap}>
        <View style={s.profileRow}>
          <Image source={{ uri: avatarUri }} style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.nickname}>{nickname}</Text>
            <Text style={s.meta}>팔로워 {followerCount} · 팔로잉 {followingCount} · Works {items.length}</Text>
          </View>

          {/* 내 프로필이면 편집/새 글, 남 프로필이면 Follow 버튼 */}
          {isMe ? (
            <View style={s.btnCol}>
              <TouchableOpacity style={s.editBtn} onPress={() => (navigation as any).navigate('EditProfile')}>
                <Text style={s.editTxt}>프로필 편집</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.editBtn, { backgroundColor: '#587dc4', marginTop: 6 }]}
                onPress={() => (navigation as any).navigate('FeedCreate')}
              >
                <Text style={s.editTxt}> 새 게시글</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FollowButton username={username} />
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
        ListFooterComponent={!hasMore ? <Text style={s.footer}>끝이에요</Text> : isLoading ? <Text style={s.footer}>불러오는 중…</Text> : null}
      />

      {/* Bottom Tab */}
      <View style={s.tabbar}>
        <TabImg src={ICON_MUSIC} onPress={() => (navigation as any).navigate('Music')} />
        <TabImg src={ICON_SHORT} onPress={() => (navigation as any).navigate('Community', { screen: 'Community' })} />
        <TabImg src={ICON_DANCE} onPress={() => (navigation as any).navigate('Dance', { screen: 'DanceScreen' })} />
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
  burger: { fontSize: 35, color: '#587dc4', paddingHorizontal: 4 },

  profileWrap: {
    paddingHorizontal: H_PADDING, paddingTop: 12, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 70, height: 70, borderRadius: 30, backgroundColor: '#E5E7EB' },
  nickname: { fontSize: 20, fontWeight: '800', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  btnCol: { marginLeft: 6 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#587dc4' },
  editTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bio: { marginTop: 10, marginLeft: 20, marginRight: 12, fontSize: 15, color: '#374151' },

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

  tabbar: {
    position: 'absolute', left:-15 , right: 20, bottom: 0, height: TAB_H,
    backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: width / 3 },
  tabIconImg: { width: 34, height: 34 },
});
