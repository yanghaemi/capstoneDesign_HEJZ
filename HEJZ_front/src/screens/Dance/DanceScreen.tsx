// screens/DanceScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  ImageBackground,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { getSongList, type Song } from '../../api/song';
import RNSoundPlayer from 'react-native-sound-player';

// 감정 목록
const EMOTIONS = [
  { label: '행복', value: '행복' },
  { label: '슬픔', value: '슬픔' },
  { label: '분노', value: '분노' },
  { label: '공포', value: '공포' },
  { label: '놀람', value: '놀람' },
  { label: '혐오', value: '혐오' },
  { label: '사랑', value: '사랑' },
  { label: '희망', value: '희망' },
  { label: '열정', value: '열정' },
  { label: '자신감', value: '자신감' },
  { label: '매혹', value: '매혹' },
  { label: '도전', value: '도전' },
  { label: '차분함', value: '차분함' },
];

// 장르 목록
const GENRES = [
  { label: 'Breakdance', value: 'Breakdance' },
  { label: 'Pop', value: 'Pop' },
  { label: 'Lock', value: 'Lock' },
  { label: 'Waack', value: 'Waack' },
  { label: 'House', value: 'House' },
  { label: 'Krump', value: 'Krump' },
  { label: 'Jazz', value: 'Jazz' },
  { label: 'LA Hip-hop', value: 'La_Hiphop' },
  { label: 'Middle Hip-hop', value: 'Middle_Hiphop' },
  { label: 'Ballet Jazz', value: 'Ballet_Jazz' },
];

const DanceScreen = ({ navigation }: any) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState("");
  const [selectedSongTitle, setSelectedSongTitle] = useState("");
  const [selectedSongFilepath, setSelectedSongFilepath] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedPlainLyrics, setSelectedPlainLyrics] = useState('');
  const [selectedLyricsJsonRaw, setSelectedLyricsJsonRaw] = useState('');
  // 재생 상태
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);

  // 모달 상태
  const [emotionModalVisible, setEmotionModalVisible] = useState(false);
  const [genreModalVisible, setGenreModalVisible] = useState(false);

  // 노래 목록 가져오기
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        console.log('[DanceScreen] 노래 목록 가져오기 시작');

        const songList = await getSongList();
        console.log('[DanceScreen] 받은 노래 목록:', songList);

        if (songList.length > 0) {
          setSongs(songList);
          console.log('[DanceScreen] 노래 목록 설정 완료:', songList.length, '개');
        } else {
          console.warn('[DanceScreen] API에서 노래 목록이 비어있습니다');
          Alert.alert('알림', 'API에서 노래 목록을 가져올 수 없습니다.');
        }
      } catch (error: any) {
        console.error('[DanceScreen] 노래 목록 가져오기 실패:', error);
        Alert.alert(
          '오류',
          '노래 목록을 불러오는데 실패했습니다.\n\n' +
          `오류: ${error?.message || error}\n\n` +
          '콘솔 로그를 확인해주세요.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  // 컴포넌트 언마운트 시 음악 정지
  useEffect(() => {
    return () => {
      try {
        RNSoundPlayer.stop();
      } catch (e) {
        console.log('Stop sound error:', e);
      }
    };
  }, []);

  const handlePlayPause = async (song: Song) => {
    try {
      if (playingSongId === song.id) {
        // 이미 재생 중이면 정지
        RNSoundPlayer.stop();
        setPlayingSongId(null);
      } else {
        // 다른 노래 재생
        RNSoundPlayer.stop(); // 이전 노래 정지

        // sourceAudioUrl 우선, 없으면 다른 URL 사용
        const audioUrl = song.sourceAudioUrl || song.streamAudioUrl || song.filepath;

        if (!audioUrl) {
          Alert.alert('오류', '재생 가능한 오디오 URL이 없습니다.');
          return;
        }

        console.log('[DanceScreen] Playing audio:', audioUrl);

        if (audioUrl.startsWith('http')) {
          await RNSoundPlayer.playUrl(audioUrl);
        } else {
          Alert.alert('오류', '유효하지 않은 오디오 URL입니다.');
          return;
        }

        setPlayingSongId(song.id);
      }
    } catch (error: any) {
      console.error('[DanceScreen] 재생 오류:', error);
      Alert.alert('재생 오류', '오디오를 재생할 수 없습니다.');
      setPlayingSongId(null);
    }
  };

  const handleNavigate = () => {
    // 재생 중인 음악 정지
    try {
      RNSoundPlayer.stop();
      setPlayingSongId(null);
    } catch (e) {
      console.log('Stop sound error:', e);
    }

    if (!selectedSongId) {
      Alert.alert('알림', '노래를 선택해주세요.');
      return;
    }
    if (!selectedEmotion) {
      Alert.alert('알림', '감정을 선택해주세요.');
      return;
    }
    if (!selectedGenre) {
      Alert.alert('알림', '장르를 선택해주세요.');
      return;
    }

    navigation.navigate('DanceRecommendScreen', {
      p_id: selectedSongId,
      p_title: selectedSongTitle,
      p_filepath: selectedSongFilepath,
      p_emotion: selectedEmotion,
      p_genre: selectedGenre,
      p_plainLyrics: selectedPlainLyrics,
      p_lyricsJsonRaw: selectedLyricsJsonRaw,
    });
  };

  const renderSongItem = ({ item }: { item: Song }) => (
    <View style={styles.songItemContainer}>
      <TouchableOpacity
        style={[
          styles.item,
          item.id === selectedSongId && styles.selectedItem,
        ]}
        onPress={() => {
          setSelectedSongId(item.taskId);
          setSelectedSongTitle(item.title);
          setSelectedSongFilepath(item.sourceAudioUrl);
          setSelectedPlainLyrics(item.plainLyrics || '');
          const raw = item.lyricsJson ?? '[]';
          setSelectedLyricsJsonRaw(typeof raw === 'string' ? raw : JSON.stringify(raw));
        }}
      >
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 재생 버튼 */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => handlePlayPause(item)}
      >
        <Text style={styles.playButtonText}>
          {playingSongId === item.id ? '⏸' : '▶️'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmotionItem = ({ item }: { item: { label: string; value: string } }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedEmotion(item.value);
        setEmotionModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const renderGenreItem = ({ item }: { item: { label: string; value: string } }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedGenre(item.value);
        setGenreModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/background/whitebackground.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#4B9DFE" />
          <Text style={styles.loadingText}>노래 목록 불러오는 중...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/background/whitebackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.header}>노래를 선택해주세요</Text>

          <FlatList
            data={songs}
            renderItem={renderSongItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>노래가 없습니다.</Text>
              </View>
            }
          />

          {/* 감정 선택 */}
          <Text style={styles.sectionHeader}>감정을 선택해주세요</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setEmotionModalVisible(true)}
          >
            <Text style={[styles.pickerText, !selectedEmotion && styles.placeholderText]}>
              {selectedEmotion || '감정을 선택하세요'}
            </Text>
            <Text style={styles.pickerIcon}>▼</Text>
          </TouchableOpacity>

          {/* 장르 선택 */}
          <Text style={styles.sectionHeader}>장르를 선택해주세요</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setGenreModalVisible(true)}
          >
            <Text style={[styles.pickerText, !selectedGenre && styles.placeholderText]}>
              {GENRES.find(g => g.value === selectedGenre)?.label || '장르를 선택하세요'}
            </Text>
            <Text style={styles.pickerIcon}>▼</Text>
          </TouchableOpacity>

          <Button
            title="안무 추천받기"
            onPress={handleNavigate}
            disabled={!selectedSongId || !selectedEmotion || !selectedGenre}
          />
        </View>
      </ScrollView>

      {/* 감정 선택 모달 */}
      <Modal
        visible={emotionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEmotionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>감정 선택</Text>
              <TouchableOpacity onPress={() => setEmotionModalVisible(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={EMOTIONS}
              renderItem={renderEmotionItem}
              keyExtractor={(item) => item.value}
            />
          </View>
        </View>
      </Modal>

      {/* 장르 선택 모달 */}
      <Modal
        visible={genreModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setGenreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>장르 선택</Text>
              <TouchableOpacity onPress={() => setGenreModalVisible(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={GENRES}
              renderItem={renderGenreItem}
              keyExtractor={(item) => item.value}
            />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default DanceScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 12,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    marginBottom: 20,
    maxHeight: 300,
  },
  songItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  item: {
    flex: 1,
    padding: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginRight: 8,
  },
  selectedItem: {
    backgroundColor: '#cde1ff',
    borderWidth: 2,
    borderColor: '#4B9DFE',
  },
  songInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  prompt: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  playButton: {
    width: 50,
    height: 50,
    backgroundColor: '#4B9DFE',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  playButtonText: {
    fontSize: 20,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  pickerIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});