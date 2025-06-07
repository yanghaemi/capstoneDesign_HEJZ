import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useUser } from '../../context/UserContext';
const MyRoomHeader = ({ navigation }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('안녕하세요! 반갑습니다 :)');

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.topRow}>
        <Image
          source={require('../../assets/icon/cat.png')}
          style={styles.profileImage}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>졔의 미니룸</Text>

          <TouchableOpacity onPress={() => setIsEditing(true)}>
            {isEditing ? (
              <TextInput
                value={bio}
                onChangeText={setBio}
                onBlur={() => setIsEditing(false)} // 포커스 벗어나면 저장
                autoFocus
                style={styles.greetingInput}
              />
            ) : (
              <Text style={styles.greeting}>{bio}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.followRow}>
        <Text style={styles.followText}>팔로워 200</Text>
        <Text style={styles.followText}>팔로잉 180</Text>
      </View>

      <View style={styles.menuRow}>
        <TouchableOpacity onPress={() => navigation.navigate('MyPageOptions')}>
          <Text style={styles.menuText}>설정</Text>
        </TouchableOpacity>
        <TouchableOpacity><Text style={styles.menuText}>게시판</Text></TouchableOpacity>

      </View>
    </View>
  );
};

export default MyRoomHeader;

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#fff', // 배경색 자유롭게~
    padding: 24,
    borderBottomWidth: 1,
    borderColor: '#aaa',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  userInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 14,
    color: '#555',
  },
  greetingInput: {
    fontSize: 14,
    color: '#333',
    borderBottomWidth: 1,
    borderColor: '#999',
    paddingVertical: 2,
  },
  followRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  followText: {
    fontSize: 13,
    color: '#333',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4b3e76',
  },
});
