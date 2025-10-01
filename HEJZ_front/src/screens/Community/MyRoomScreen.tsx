// screens/MyProfileScreen.tsx
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, Image,
  Dimensions, TouchableOpacity, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const THUMB = Math.floor((width - GAP * (COLS - 1)) / COLS);
const TAB_H = 58;

type Clip = { id: string; localKey: 'v1' | 'v2' };

export default function MyProfileScreen() {
  const navigation = useNavigation();

  // 로컬 비디오만 사용
  const data: Clip[] = [
    { id: 'video1', localKey: 'v1' },
    { id: 'video2', localKey: 'v2' },
  ];

  const renderItem = ({ item }: { item: Clip }) => (
    <TouchableOpacity
      style={s.gridItem}
      activeOpacity={0.85}
      onPress={() => (navigation as any).navigate('VideoPlayerScreen', { key: item.localKey })}
    >
      {/* 썸네일 대용 – 깔끔한 플레이커버 */}
      <View style={s.thumbCover}>
        <Text style={s.playIcon}>▶</Text>
        <Text style={s.thumbLabel}>{item.localKey === 'v1' ? 'video1.mp4' : 'video2.mp4'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.screen}>
      <SafeAreaView />
      <StatusBar barStyle="light-content" backgroundColor="#0B1020" />

      {/* 상단 앱바(로고) */}
      <View style={s.appbar}>
        <Image
          source={require('../../assets/icon/U-STAR.png')}
          resizeMode="contain"
          style={s.logo}
        />
      </View>

      {/* 프로필 한 줄 */}
      <View style={s.profileRow}>
        <Image source={{ uri: 'https://picsum.photos/200/200' }} style={s.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={s.name}>u-star | 지혜</Text>
          <Text style={s.meta}>Fans 1,248 · Works {data.length}</Text>
        </View>
        <TouchableOpacity style={s.editBtn} onPress={() => (navigation as any).navigate('EditProfile')}>
          <Text style={s.editTxt}>편집</Text>
        </TouchableOpacity>
      </View>

      {/* 3열 그리드 (지금은 2개만 노출) */}
      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP }}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_H + 20 }}
      />

      {/* 하단 플랫 탭바 */}
      <View style={s.tabbar}>
        <Tab
          icon="🎵"
          label="노래생성"
          onPress={() => (navigation as any).navigate('Music')}
        />
        <Tab
          icon="👀"
          label="숏츠"
          onPress={() => (navigation as any).navigate('Community', { screen: 'Community' })}
        />
        <Tab
          icon="🕺"
          label="안무+녹화"
          onPress={() => (navigation as any).navigate('Dance', { screen: 'DanceScreen' })}
        />
      </View>

    </View>
  );
}

function Tab({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.tabItem} onPress={onPress} activeOpacity={0.8}>
      <Text style={s.tabIcon}>{icon}</Text>
      <Text style={s.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },

  appbar: {
    height: 56, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0B1020', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0B1020',
  },
  logo: { width: 96, height: 28 },

  profileRow: {
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E7EB' },
  name: { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#111827' },
  editTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  gridItem: { width: THUMB, height: THUMB, backgroundColor: '#FFF' },
  // 플레이 커버(간단 썸네일)
  thumbCover: {
    flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center',
  },
  playIcon: { fontSize: 28, color: '#FFFFFF', marginBottom: 6 },
  thumbLabel: { fontSize: 11, color: '#E5E7EB' },

  tabbar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: TAB_H,
    backgroundColor: '#FFFFFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', minWidth: width / 3 },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 11, color: '#111827', fontWeight: '600' },
});
