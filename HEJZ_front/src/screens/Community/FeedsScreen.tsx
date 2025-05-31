import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { Image } from 'react-native'
const dummyShorts = [
  { id: '1', title: ' 감성 힙합 숏츠' },
  { id: '2', title: '안무 영상' },
  { id: '3', title: ' 감정 댄스' },
];

const FeedScreen = ({ navigation }: any) => {
  const { user } = useUser(); // 전역 사용자 정보 받아오기

  const renderItem = ({ item }: { item: { id: string; title: string } }) => (
    <View style={styles.gridItem}>
      <View style={styles.thumbnail} />
    </View>
  );


  return (
    <View style={styles.container}>
      {/* 옵션 메뉴 버튼 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('MyPageOptions')}
      >
        <Text style={styles.menuText}>⋮</Text>
      </TouchableOpacity>

      {/* 사용자 프로필 정보 */}
      <View style={styles.profileBox}>{user.profileImage ? (<Image source={user.profileImage} style={styles.avatar} /> ) : (<View style={styles.avatar} />)}
        <View style={{ flex: 1 }}>
          <Text style={styles.nickname}>{user.name}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.bio}>{user.bio || '소개가 없습니다.'}</Text>
        </View>
      </View>

<TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
  <Text style={styles.editButtonText}>내 정보 수정</Text>
</TouchableOpacity>


      {/* 영상 리스트 */}
      <FlatList
        data={dummyShorts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3} // 한 줄에 3개씩
        columnWrapperStyle={styles.row} //  줄 간 간격 설정
        contentContainerStyle={styles.gridContainer}
/>

    </View>
  );
};

export default FeedScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ccc',
  },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: '#444',
  },
  listContainer: {
    paddingBottom: 100,
  },
  shortsItem: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  shortsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  editButton: {
  alignSelf: 'flex-end',
  backgroundColor: '#4B9DFE',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginBottom: 20,
},
editButtonText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},
gridContainer: {
  paddingBottom: 80,
},
row: {
  justifyContent: 'space-between',
  marginBottom: 10,
},
gridItem: {
  width: '32%', // 3개 맞추기 위해
  aspectRatio: 1,
  borderRadius: 8,
  backgroundColor: '#eee',
},
thumbnail: {
  flex: 1,
  borderRadius: 8,
  backgroundColor: '#ccc',
},


});