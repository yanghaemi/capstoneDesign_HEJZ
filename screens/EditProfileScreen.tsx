import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from './UserContext'; // Context import
const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, setUser } = useUser();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);

  const handleSave = () => {
    setUser({ ...user, name, bio }); // 전역 상태 업데이트
    Alert.alert('저장 완료', '프로필 정보가 저장되었습니다.');
    navigation.goBack(); // 피드로 돌아감
  };

  const handleChangeProfileImage = () => {
  // 실제 앱이라면 이미지 picker 열기
  // 여기선 더미 이미지로 고정
    setUser({ ...user,  profileImage: require('../assets/cat.png') }); // 대체용 이미지 URL
    Alert.alert('프로필 이미지가 변경되었습니다!');
  };


  const handleChangePassword = () => {
    Alert.alert('알림', '비밀번호 수정 기능은 준비 중입니다!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 정보 수정</Text>

      <TouchableOpacity onPress={handleChangeProfileImage} style={styles.profileContainer}>
        <Image
          source={require('../assets/cat.png')} // 실제 이미지로 교체 가능
          style={styles.profileImage}
        />
        <Text style={styles.changePhotoText}>프로필 사진 변경</Text>
      </TouchableOpacity>

      <Text style={styles.label}>닉네임</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="닉네임을 입력하세요"
      />

      <Text style={styles.label}>자기소개</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={bio}
        onChangeText={setBio}
        placeholder="자기소개를 입력하세요"
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장하기</Text>
      </TouchableOpacity>

      <View style={styles.extraButtons}>
        <TouchableOpacity style={styles.extraButton} onPress={handleChangePassword}>
          <Text style={styles.extraButtonText}>🔒 비밀번호 수정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraButton} onPress={() => Alert.alert('연결된 계정 관리 준비 중')}>
          <Text style={styles.extraButtonText}>🔗 연결된 계정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraButton} onPress={() => Alert.alert('알림 설정 준비 중')}>
          <Text style={styles.extraButtonText}>🔔 알림 설정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EditProfileScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#4B9DFE',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 20,
  },
  multilineInput: {
    textAlignVertical: 'top',
    height: 100,
  },
  saveButton: {
    backgroundColor: '#4B9DFE',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  extraButtons: {
    gap: 12,
  },
  extraButton: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
  },
  extraButtonText: {
    fontSize: 15,
    color: '#333',
  },
});
