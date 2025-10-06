import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadMedia } from '../api/upload';
import { createFeed } from '../api/feed';

export default function ComposeFeedScreen() {
  const [content, setContent] = useState('');
  const [picked, setPicked] = useState<{ uri:string; type?:string; fileName?:string }|null>(null);
  const [busy, setBusy] = useState(false);

  const pickVideo = async () => {
    const res = await launchImageLibrary({ mediaType:'video', selectionLimit:1, includeExtra:true });
    const a = res.assets?.[0];
    if (!a?.uri) return;
    setPicked({ uri:a.uri, type:a.type || 'video/mp4', fileName:a.fileName || `video_${Date.now()}.mp4` });
  };

  const onSubmit = async () => {
    if (!content.trim()) return Alert.alert('알림','내용을 입력해줘!');
    if (!picked) return Alert.alert('알림','영상을 선택해줘!');

    try {
      setBusy(true);
      const url = await uploadMedia({ uri:picked.uri, type:picked.type || 'video/mp4', name:picked.fileName || 'video.mp4' });
      await createFeed({ content, imageUrls:[url] });
      Alert.alert('성공','피드가 등록됐어!');
      setContent(''); setPicked(null);
    } catch (e:any) {
      Alert.alert('에러', e?.message ?? '등록 실패');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ flex:1, padding:16, gap:12 }}>
      <Button title="영상 선택" onPress={pickVideo} />
      {picked ? <Text numberOfLines={1}>{picked.fileName}</Text> : null}
      <TextInput
        placeholder="내용(최대 255자)" value={content} onChangeText={setContent} maxLength={255}
        style={{ borderWidth:1, borderColor:'#ddd', padding:12, borderRadius:8 }} multiline
      />
      <Button title={busy ? '올리는 중…' : '등록'} onPress={onSubmit} disabled={busy} />
    </View>
  );
}
