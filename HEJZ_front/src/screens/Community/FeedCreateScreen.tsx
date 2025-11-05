// screens/FeedCreateScreen.tsx - 최종 버전 (songId 제거)
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
  Alert, ScrollView, PermissionsAndroid, Platform, Modal, FlatList
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { createFeed } from '../../api/feed';
import { useNavigation } from '@react-navigation/native';
import { getSongList } from '../../api/song';

const EMOTIONS = [
  '행복','슬픔','분노','공포','놀람','혐오','사랑','희망','열정','자신감','매혹','도전','차분함'
].map(label => ({ label, lower: label.toLowerCase() }));

const GENRES = [
  'Breakdance','Pop','Lock','Waack','House','Krump','Jazz','LA Hip-hop','Middle Hip-hop','Ballet Jazz'
].map(label => ({ label, lower: label.toLowerCase() }));

export default function FeedCreateScreen() {
  const nav = useNavigation();
  const [content, setContent] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(false);

  const [emotion, setEmotion] = useState<{label:string; lower:string} | null>(null);
  const [genre, setGenre] = useState<{label:string; lower:string} | null>(null);

  const [songModal, setSongModal] = useState(false);
  const [songs, setSongs] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await getSongList();
        const rows = (Array.isArray(raw) ? raw : [])
          .map((s: any) => ({
            id: String(s.task_id),
            title: String(s.title ?? ''),
          }))
          .filter(r => r.id && r.title);
        setSongs(rows);
      } catch (e:any) {
        console.warn('[FeedCreate] getSongList fail:', e?.message ?? e);
      }
    })();
  }, []);

  const askPerm = async () => {
    if (Platform.OS !== 'android') return true;
    const perm =
      Platform.Version >= 33
        ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]
        : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];

    const res = await PermissionsAndroid.requestMultiple(perm);
    return Object.values(res).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
  };

  const pick = async () => {
    const ok = await askPerm();
    if (!ok) return Alert.alert('권한 필요', '갤러리 접근 권한을 허용해주세요.');

    const r = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 5,
      includeExtra: true,
    });
    if (r.didCancel) return;
    if (r.errorMessage) return Alert.alert('선택 실패', r.errorMessage);
    setAssets(r.assets ?? []);
  };

  const submit = async () => {
    if (busy) {
      console.log('[FeedCreate] 이미 업로드 중, 무시');
      return;
    }

    if (!emotion) return Alert.alert('알림', '감정을 선택해줘!');
    if (!genre)   return Alert.alert('알림', '장르를 선택해줘!');
    if (!content.trim() && (!assets || assets.length === 0)) {
      return Alert.alert('알림', '내용 또는 미디어 중 하나는 있어야 해!');
    }

    try {
      setBusy(true);
      console.log('[FeedCreate] ========== 업로드 시작 ==========');

      // 1) 파일 업로드
      const urls: string[] = [];
      for (const a of assets) {
        if (!a.uri) continue;
        const isVideo = a.type?.startsWith('video') || (a.fileName ?? '').toLowerCase().endsWith('.mp4');
        const name = a.fileName || (isVideo ? 'video.mp4' : 'image.jpg');
        const type = a.type || (isVideo ? 'video/mp4' : 'image/jpeg');
        const url  = await uploadFile({ uri: a.uri, name, type });
        urls.push(url);
      }

      // 2) 피드 생성 — 🔧 songId를 아예 보내지 않음
      const payload: any = {
        content,
        imageUrls: urls,
        emotion: emotion.lower,
        genre:   genre.lower,
        // songId: 제거 (백엔드에서 optional로 처리하도록)
      };

      console.log('[FeedCreate] createFeed 요청 payload:', JSON.stringify(payload, null, 2));
      await createFeed(payload);

      console.log('[FeedCreate] ========== 업로드 완전 완료 ==========');
      Alert.alert('완료', '피드가 등록되었습니다.');
      // @ts-ignore
      nav.navigate('MyRoom', { refresh: Date.now() });
    } catch (e: any) {
      console.error('[FeedCreate] 업로드 실패:', e);
      Alert.alert('업로드 실패', e?.message || '오류가 발생했어요.');
    } finally {
      console.log('[FeedCreate] setBusy(false) 실행');
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.title}>새 피드</Text>

      <Text style={s.label}>감정</Text>
      <View style={s.chipsWrap}>
        {EMOTIONS.map(opt => (
          <TouchableOpacity
            key={opt.lower}
            onPress={() => setEmotion(opt)}
            style={[s.chip, emotion?.lower === opt.lower && s.chipOn]}
            activeOpacity={0.85}
          >
            <Text style={[s.chipTxt, emotion?.lower === opt.lower && s.chipTxtOn]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>장르</Text>
      <View style={s.chipsWrap}>
        {GENRES.map(opt => (
          <TouchableOpacity
            key={opt.lower}
            onPress={() => setGenre(opt)}
            style={[s.chip, genre?.lower === opt.lower && s.chipOn]}
            activeOpacity={0.85}
          >
            <Text style={[s.chipTxt, genre?.lower === opt.lower && s.chipTxtOn]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>노래 (선택 안 함)</Text>
      <TouchableOpacity
        onPress={() => setSongModal(true)}
        style={s.selector}
        activeOpacity={0.9}
      >
        <Text style={s.selectorTxt}>
          {selectedSongId !== null
            ? (songs.find(s => s.id === selectedSongId)?.title ?? `song_${selectedSongId}`)
            : '노래 선택 (표시만, 전송 안 함)'}
        </Text>
      </TouchableOpacity>

      <Text style={s.label}>내용</Text>
      <TextInput
        style={s.input}
        placeholder="내용을 입력하세요 (최대 255자)"
        value={content}
        onChangeText={setContent}
        maxLength={255}
        multiline
      />

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {assets.map((a, i) => (
          <Image key={i} source={{ uri: a.uri }} style={s.thumb} />
        ))}
      </View>

      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, { opacity: busy ? 0.5 : 1 }]}
          onPress={pick}
          disabled={busy}
        >
          <Text style={s.btnTxt}>갤러리에서 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#111827', opacity: busy ? 0.6 : 1 }]}
          onPress={submit}
          disabled={busy}
          activeOpacity={busy ? 1 : 0.7}
        >
          <Text style={[s.btnTxt, { color: '#fff' }]}>{busy ? '업로드 중…' : '등록'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={songModal} transparent animationType="fade" onRequestClose={() => setSongModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSongModal(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>노래 선택</Text>
            <FlatList
              data={songs}
              keyExtractor={(it, idx) => `${it.id}-${idx}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.songRow}
                  onPress={() => { setSelectedSongId(item.id); setSongModal(false); }}
                >
                  <Text style={s.songTitle}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  title: { fontSize: 18, fontWeight: '700' },
  label: { marginTop: 6, marginBottom: 4, fontSize: 14, fontWeight: '700', color: '#111827' },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipOn: { backgroundColor: '#587dc4' },
  chipTxt: { color: '#111827', fontWeight: '600' },
  chipTxtOn: { color: '#fff' },

  selector: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14 },
  selectorTxt: { color: '#111827', fontWeight: '600' },

  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, minHeight: 80 },
  thumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#eee' },
  row: { flexDirection: 'row', gap: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6', flex: 1 },
  btnTxt: { fontWeight: '700', color: '#111827', textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, width: '100%', maxHeight: '70%', padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  songRow: { paddingVertical: 10 },
  songTitle: { fontSize: 14, color: '#111827' },
});