// src/screens/SearchScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SectionList,
  Image,
  Keyboard,
  Dimensions,
  Alert,
} from 'react-native';
import { BASE_URL } from '../../api/baseUrl';
import { searchAll } from '../../api/search';
import { getFollowings, getFollowers } from '../../api/follow';
import { fetchUserPublicByUsername } from '../../api/user';

const { width } = Dimensions.get('window');

// 스코프 2종만 사용
const SCOPES = ['ALL', 'FOLLOWING'] as const;
type Scope = typeof SCOPES[number];

function absUrl(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`;
}
function safeJson(v: any) {
  try { return JSON.stringify(v); } catch { return String(v); }
}

// userId -> username 해석
function resolveUsernameFromItem(it: any, idMap: Map<number, string>): string | undefined {
  if (typeof it?.username === 'string' && it.username) return it.username;
  if (typeof it?.authorUsername === 'string' && it.authorUsername) return it.authorUsername;
  if (typeof it?.user?.username === 'string' && it.user.username) return it.user.username;

  const uid = typeof it?.userId === 'number' ? it.userId : undefined;
  if (uid && idMap.has(uid)) return idMap.get(uid)!;

  return undefined;
}

export default function SearchScreen({ navigation }: any) {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState<Scope>('ALL');
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // 팔로잉/팔로워에서 수집한 id->username 맵, 그리고 내가 팔로우 중인 집합
  const [idUsernameMap, setIdUsernameMap] = useState<Map<number, string>>(new Map());
  const [followingIds, setFollowingIds] = useState<Set<number | string>>(new Set());

  // 1) 내 팔로잉/팔로워 불러와서 id→username 맵 + following 집합 구성
  useEffect(() => {
    (async () => {
      try {
        const [followings, followers] = await Promise.all([
          getFollowings().catch(() => []),
          getFollowers().catch(() => []),
        ]);

        const idMap = new Map<number, string>();
        const followingSet = new Set<number | string>();

        const pushMap = (arr: any[]) => {
          for (const it of Array.isArray(arr) ? arr : []) {
            const id =
              typeof it?.userId === 'number' ? it.userId :
              typeof it?.id === 'number' ? it.id :
              undefined;
            const uname = typeof it?.username === 'string' ? it.username : undefined;
            if (id && uname && !idMap.has(id)) idMap.set(id, uname);
          }
        };

        // 팔로잉은 following 집합에도 추가
        for (const it of Array.isArray(followings) ? followings : []) {
          const id =
            typeof it?.userId === 'number' ? it.userId :
            typeof it?.id === 'number' ? it.id :
            undefined;
          const uname = typeof it?.username === 'string' ? it.username : undefined;
          if (id) followingSet.add(id);
          if (uname) followingSet.add(uname);
        }

        pushMap(followings);
        pushMap(followers);

        setIdUsernameMap(idMap);
        setFollowingIds(followingSet);
      } catch {
        setIdUsernameMap(new Map());
        setFollowingIds(new Set());
      }
    })();
  }, []);

  // 2) 디바운스 검색
  useEffect(() => {
    if (!q.trim()) {
      setData(null);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);

    const t = setTimeout(async () => {
      try {
        const d = await searchAll({ keyword: q.trim(), limit });
        setData(d);
      } catch (e: any) {
        setErr(e?.message ?? '검색 실패');
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [q, limit]);

  // 3) (중요) 현재 검색결과에서 발견되는 (userId, username) 쌍을 맵에 합친다
  useEffect(() => {
    if (!Array.isArray(data)) return;
    if (data.length === 0) return;

    setIdUsernameMap(prev => {
      const next = new Map(prev);
      for (const it of data) {
        const uid = typeof it?.userId === 'number' ? it.userId : undefined;
        const uname =
          (typeof it?.username === 'string' && it.username) ||
          (typeof it?.authorUsername === 'string' && it.authorUsername) ||
          (typeof it?.user?.username === 'string' && it.user.username) ||
          undefined;
        if (uid && uname && !next.has(uid)) next.set(uid, uname);
      }
      return next;
    });
  }, [data]);

  // 결과(배열만 온다고 가정) → 스코프에 따라 필터링
  const posts: any[] = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    if (scope === 'ALL') return arr;

    // FOLLOWING: 게시글의 작성자(userId or username)가 내 팔로잉에 포함된 것만
    return arr.filter((item) => {
      const uid = item?.userId; // number
      const uname = resolveUsernameFromItem(item, idUsernameMap); // username (해석)
      const hit =
        (typeof uid === 'number' && followingIds.has(uid)) ||
        (typeof uname === 'string' && followingIds.has(uname));
      return hit;
    });
  }, [data, scope, followingIds, idUsernameMap]);

  // 섹션 하나(Posts)로 그리기
  const sections = useMemo(
    () =>
      posts.length
        ? [{ title: scope === 'FOLLOWING' ? 'following posts' : 'posts', key: 'posts', data: posts }]
        : [],
    [posts, scope]
  );

  // 아이템 렌더
  const renderItem = ({ item }: any) => {
    const imgUrl = item?.images?.[0]?.url ?? item?.media?.[0]?.url ?? null;
    const thumb = imgUrl ? absUrl(imgUrl) ?? undefined : undefined;

    // FeedDetail에 맞게 images 형태로 통일
    const images =
      item?.images ??
      (Array.isArray(item?.media)
        ? item.media.map((m: any) => ({ url: m?.url, ord: m?.ord, type: m?.type }))
        : []);

    // userId → username 치환
    const resolvedUsername = resolveUsernameFromItem(item, idUsernameMap);
    const showLine =
      resolvedUsername
        ? `@${resolvedUsername}`
        : (typeof item?.userId === 'number' ? `userId: ${item.userId}` : '');

    // 작성자 칩 onPress 핸들러 안
    const goToAuthor = async () => {
      try {
        if (resolvedUsername) {
          // username을 얻었으면: 공개 프로필 일부 받아서 UserRoom으로
          const u = await fetchUserPublicByUsername(resolvedUsername).catch(() => null);
          navigation.navigate('UserRoom', {
            username: u?.username ?? resolvedUsername,
            nickname: u?.nickname ?? resolvedUsername,
            bio: u?.bio ?? '',
            avatarUrl: u?.avatarUrl ?? u?.profileImageUrl ?? null,
            followers: u?.followers ?? 0,
            following: u?.following ?? 0,
          });
          return;
        }

        // username이 없고 userId만 있을 때: 같은 작성자의 포스트 묶어 seedPosts로 넘김
        if (typeof item?.userId === 'number') {
          const sameUserPosts = posts.filter(p => p?.userId === item.userId);
          navigation.navigate('UserRoom', {
            userId: item.userId,
            seedPosts: sameUserPosts, // UserRoom에서 이걸로 닉네임/아바타/그리드 합성
          });
          return;
        }

        // 최후: 피드 상세로
        navigation.navigate('FeedDetail', {
          feedId: item?.id,
          content: item?.content,
          images,
        });
      } catch {}
    };


    return (
      <TouchableOpacity
        style={s.cardRow}
        onPress={() =>
          navigation.navigate('FeedDetail', {
            feedId: item?.id,
            content: item?.content,
            images,
          })
        }
        activeOpacity={0.85}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={s.thumb} />
        ) : (
          <View style={[s.thumb, s.thumbFallback]} />
        )}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={s.titleTxt}>
            {item?.content ?? '(내용 없음)'}
          </Text>

          {/* 표시도 username 우선, 없으면 userId */}
          <Text style={s.subTxt}>{showLine}</Text>

          {/* 작성자 칩 (탭 시 UserRoom으로) */}
          <TouchableOpacity onPress={goToAuthor} style={s.authorChip} activeOpacity={0.8}>
            <Text style={s.authorTxt}>{showLine || '작성자'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.screen}>
      {/* 상단 검색바 */}
      <View style={s.searchBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="게시글 내용으로 검색"
          placeholderTextColor="#9CA3AF"
          style={s.input}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          autoFocus
        />
        <TouchableOpacity
          onPress={() => setQ('')}
          style={s.clearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.clearTxt}>×</Text>
        </TouchableOpacity>
      </View>

      {/* 스코프 탭: ALL / FOLLOWING */}
      <View style={s.scopeRow}>
        {SCOPES.map((sc) => (
          <TouchableOpacity
            key={sc}
            style={[s.scopeBtn, scope === sc && s.scopeBtnOn]}
            onPress={() => setScope(sc)}
            activeOpacity={0.85}
          >
            <Text style={[s.scopeTxt, scope === sc && s.scopeTxtOn]}>
              {sc === 'ALL' ? 'ALL' : 'FOLLOWING'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 상태 */}
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} /> : null}
      {err ? <Text style={s.errTxt}>{err}</Text> : null}

      {/* 결과 */}
      <SectionList
        sections={sections}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <Text style={s.sectionHeader}>{section.title}</Text>
        )}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !loading && q.trim().length > 0 ? (
            <Text style={s.empty}>
              {scope === 'FOLLOWING' ? '팔로잉한 사용자의 게시글 중 결과가 없어요' : '검색 결과가 없어요'}
            </Text>
          ) : (
            <Text style={s.empty}>검색어를 입력해보세요</Text>
          )
        }
      />

      {/* 더보기 (limit 증가: 서버에 limit만 늘려 다시 검색) */}
      {sections.length > 0 && (
        <TouchableOpacity
          style={s.moreBtn}
          onPress={() => setLimit((prev) => prev + 20)}
          activeOpacity={0.9}
        >
          <Text style={s.moreTxt}>더 보기 +20</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  // 검색바
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { paddingRight: 6, paddingVertical: 4 },
  backTxt: { fontSize: 26, color: '#111827' },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    color: '#111827',
  },
  clearBtn: { paddingLeft: 6, paddingVertical: 4 },
  clearTxt: { fontSize: 22, color: '#9CA3AF' },

  // 스코프
  scopeRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  scopeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  scopeBtnOn: { backgroundColor: '#587dc4' },
  scopeTxt: { fontSize: 12, color: '#4B5563', fontWeight: '700' },
  scopeTxtOn: { color: '#fff' },

  // 리스트
  sectionHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 14 },

  // 썸네일
  thumb: { width: 60, height: 60, borderRadius: 8, marginRight: 12, backgroundColor: '#E5E7EB' },
  thumbFallback: { backgroundColor: '#0F172A' },

  // 텍스트
  titleTxt: { fontSize: 14, color: '#111827', fontWeight: '700' },
  subTxt: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // 상태
  empty: { textAlign: 'center', paddingVertical: 24, color: '#9CA3AF' },
  errTxt: { textAlign: 'center', marginTop: 12, color: '#EF4444' },

  // 더보기 버튼
  moreBtn: {
    position: 'absolute',
    bottom: 14,
    left: width * 0.5 - 60,
    width: 120,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  moreTxt: { color: '#fff', fontWeight: '800' },

  // 작성자 칩
  authorChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  authorTxt: { fontSize: 12, color: '#374151', fontWeight: '700' },
});
