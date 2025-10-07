// screens/FeedCreateScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
  Alert, ScrollView, PermissionsAndroid, Platform
} from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { uploadFile } from '../../api/files';
import { createFeed } from '../../api/feed';
import { useNavigation } from '@react-navigation/native';

export default function FeedCreateScreen() {
  const nav = useNavigation();
  const [content, setContent] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(false);

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
    if (busy) return;
    try {
      setBusy(true);

      // 1) 파일 업로드
      const urls: string[] = [];
      for (const a of assets) {
        if (!a.uri) continue;
        const isVideo =
          (a.type?.startsWith('video') ||
            (a.fileName ?? '').toLowerCase().endsWith('.mp4'));
        const name = a.fileName || (isVideo ? 'video.mp4' : 'image.jpg');
        const type = a.type || (isVideo ? 'video/mp4' : 'image/jpeg');

        // ⬇️ token 인자 제거 (uploadFile 내부에서 토큰 처리)
        const url = await uploadFile({ uri: a.uri, name, type });
        urls.push(url);
      }

      // 2) 피드 생성
      await createFeed({ content, imageUrls: urls });
      Alert.alert('완료', '피드가 등록되었습니다.');
      // @ts-ignore
      nav.navigate('MyRoom', { refresh: Date.now() });
    } catch (e: any) {
      Alert.alert('업로드 실패', e?.message || '오류가 발생했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.title}>새 피드</Text>
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
        <TouchableOpacity style={s.btn} onPress={pick}>
          <Text style={s.btnTxt}>갤러리에서 선택</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: '#111827', opacity: busy ? 0.6 : 1 }]}
          onPress={submit}
          disabled={busy}
        >
          <Text style={[s.btnTxt, { color: '#fff' }]}>{busy ? '업로드 중…' : '등록'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 14 },
  title: { fontSize: 18, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, minHeight: 80 },
  thumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: '#eee' },
  row: { flexDirection: 'row', gap: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f3f4f6' },
  btnTxt: { fontWeight: '700', color: '#111827' },
});