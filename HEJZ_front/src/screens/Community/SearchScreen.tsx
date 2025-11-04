// src/screens/SearchScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { BASE_URL } from '../../api/baseUrl';
import { searchAll } from '../../api/search';
import { getFollowings, getFollowers } from '../../api/follow';
import { fetchUserPublicByUsername, fetchUserInfoById } from '../../api/user';

const { width } = Dimensions.get('window');

// 스코프 2종만 사용
const SCOPES = ['ALL', 'FOLLOWING'] as const;
type Scope = typeof SCOPES[number];

function absUrl(u?: string | null) {
  if (!u) return null;
  return /^https?:\/\//i.test(u) ? u : `${BASE_URL}${u}`;
}

// userId -> username 해석
function resolveUsernameFromItem(it: any, idMap: Map<number, string>): string | undefined {
  // 1순위: 아이템에 직접 포함된 username
  if (typeof it?.username === 'string' && it.username) return it.username;
  if (typeof it?.authorUsername === 'string' && it.authorUsername) return it.authorUsername;
  if (typeof it?.user?.username === 'string' && it.user.username) return it.user.username;

  // 2순위: idMap에서 조회
  const uid =
    typeof it?.userId === 'number' ? it.userId :
    typeof it?.authorId === 'number' ? it.authorId :
    typeof it?.user?.id === 'number' ? it.user.id :
    undefined;
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

  // 진행 중인 userId -> info 요청 중복 방지용
  const inFlightRef = useRef<Set<number>>(new Set());

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

        // 🔍 디버깅: 실제 응답 구조 확인
        console.log('=== 검색 결과 ===');
        console.log('전체:', JSON.stringify(d, null, 2));
        if (Array.isArray(d) && d.length > 0) {
          console.log('첫 번째 아이템:', JSON.stringify(d[0], null, 2));
        }

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

  // 3-a) 현재 검색결과에서 발견되는 (userId, username) 쌍을 맵에 합친다 (직접 포함된 username 우선)
  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;

    setIdUsernameMap(prev => {
      const next = new Map(prev);

      // 개별 아이템에서 바로 찾기
      for (const it of data) {
        const uname = resolveUsernameFromItem(it, next);
        const uid =
          typeof it?.userId === 'number' ? it.userId :
          typeof it?.authorId === 'number' ? it.authorId :
          typeof it?.user?.id === 'number' ? it.user.id :
          undefined;

        if (uid && uname && !next.has(uid)) next.set(uid, uname);
      }

      // 동일 userId 그룹 내에서 누가 username 들고 있으면 전파
      const byUid = new Map<number, { uname?: string }>();
      for (const it of data) {
        const uid =
          typeof it?.userId === 'number' ? it.userId :
          typeof it?.authorId === 'number' ? it.authorId :
          typeof it?.user?.id === 'number' ? it.user.id :
          undefined;
        if (!uid) continue;

        const known = byUid.get(uid) ?? {};
        const uname =
          (typeof it?.username === 'string' && it.username) ||
          (typeof it?.authorUsername === 'string' && it.authorUsername) ||
          (typeof it?.user?.username === 'string' && it.user.username) ||
          (typeof it?.author?.username === 'string' && it.author.username) ||
          (typeof it?.owner?.username === 'string' && it.owner.username) ||
          (typeof it?.createdBy?.username === 'string' && it.createdBy.username) ||
          undefined;

        if (uname) known.uname = uname;
        byUid.set(uid, known);
      }
      for (const [uid, { uname }] of byUid) {
        if (uid && uname && !next.has(uid)) next.set(uid, uname);
      }

      return next;
    });
  }, [data]);

  // 3-b) 남은 userId들에 대해 /api/user/info 로 username 채우기 (최대 20개 동시)
  // SearchScreen.tsx의 3-b) useEffect 수정
  useEffect(() => {
    console.log('[username 수집] useEffect 시작, data 개수:', data?.length ?? 0);

    if (!Array.isArray(data) || data.length === 0) {
      console.log('[username 수집] data가 비어있어서 종료');
      return;
    }

    const need: number[] = [];
    for (const it of data) {
      const uid =
        typeof it?.userId === 'number' ? it.userId :
        typeof it?.authorId === 'number' ? it.authorId :
        typeof it?.user?.id === 'number' ? it.user.id :
        undefined;

      if (!uid) continue;

      // ⚠️ 여기서는 현재 상태를 직접 읽지 말고, inFlightRef만 체크
      if (inFlightRef.current.has(uid)) {
        console.log(`[username 수집] 요청 중: userId=${uid}`);
        continue;
      }

      need.push(uid);
      inFlightRef.current.add(uid);
      if (need.length >= 20) break;
    }

    console.log(`[username 수집] API 호출할 userId들:`, need);

    if (need.length === 0) {
      console.log('[username 수집] 호출할 userId가 없어서 종료');
      return;
    }

    let cancelled = false;
    (async () => {
      console.log('[username 수집] 비동기 함수 시작');
      try {
        const results = await Promise.all(
          need.map(async (id) => {
            try {
              const user = await fetchUserInfoById(id);
              console.log(`[username 수집] API 성공: ${id} -> ${user?.username}`);
              return { userId: id, user };
            } catch (err: any) {
              console.log(`[username 수집] API 실패: userId=${id}, error=${err?.message}`);
              return { userId: id, user: null };
            }
          })
        );

        console.log('[username 수집] Promise.all 완료, cancelled?', cancelled);
        if (cancelled) {
          console.log('[username 수집] ❌ cancelled=true이므로 맵 업데이트 안함');
          return;
        }

        console.log(`[username 수집] 성공한 결과 개수:`, results.filter(r => r.user).length);

        setIdUsernameMap(prev => {
          console.log('[username 수집] setIdUsernameMap 시작, 기존 맵 크기:', prev.size);
          const next = new Map(prev);

          let addedCount = 0;
          for (const { userId, user } of results) {
            if (user?.username && !next.has(userId)) {
              console.log(`[username 수집] ✅ 맵에 추가: ${userId} -> ${user.username}`);
              next.set(userId, user.username);
              addedCount++;
            }
          }

          console.log(`[username 수집] 최종: ${addedCount}개 추가됨, 새 맵 크기: ${next.size}`);
          return next;
        });
      } catch (error: any) {
        console.log('[username 수집] 예외 발생:', error?.message);
      } finally {
        console.log('[username 수집] finally, inFlight에서 제거:', need);
        need.forEach(id => inFlightRef.current.delete(id));
      }
    })();

    return () => {
      console.log('[username 수집] cleanup, cancelled=true');
      cancelled = true;
    };
  }, [data]); // ✅ idUsernameMap 제거! data만 의존

  // 결과(배열만 온다고 가정) → 스코프에 따라 필터링
  const posts: any[] = useMemo(() => {
    const arr = Array.isArray(data) ? data : [];
    if (scope === 'ALL') return arr;

    // FOLLOWING: 게시글의 작성자(userId or username)가 내 팔로잉에 포함된 것만
    return arr.filter((item) => {
      const uid =
        typeof item?.userId === 'number' ? item.userId :
        typeof item?.authorId === 'number' ? item.authorId :
        undefined;
      const uname = resolveUsernameFromItem(item, idUsernameMap);
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

    // 표시 라인: username이 있으면 username 사용, 없으면 "작성자 정보 없음"
    const showLine = resolvedUsername
      ? `@${resolvedUsername}`
      : '작성자 정보 없음';

    // 작성자 칩 onPress
    // SearchScreen.tsx의 goToAuthor 수정
    const goToAuthor = () => {
      // userId 추출
      const uid =
        typeof item?.userId === 'number' ? item.userId :
        typeof item?.authorId === 'number' ? item.authorId :
        typeof item?.user?.id === 'number' ? item.user.id :
        undefined;

      if (resolvedUsername && uid) {
        // ✅ username과 userId만 전달, UserRoom에서 API 호출
        navigation.navigate('UserRoom', {
          username: resolvedUsername,
          userId: uid,
        });
      } else if (resolvedUsername) {
        // userId가 없으면 FeedDetail로
        navigation.navigate('FeedDetail', {
          feedId: item?.id,
          content: item?.content,
          images,
        });
      }
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

          {/* username 우선 표시 */}
          <Text style={s.subTxt}>{showLine}</Text>

          {/* 작성자 칩 (탭 시 UserRoom으로) */}
          {resolvedUsername && (
            <TouchableOpacity onPress={goToAuthor} style={s.authorChip} activeOpacity={0.8}>
              <Text style={s.authorTxt}>{showLine}</Text>
            </TouchableOpacity>
          )}
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
