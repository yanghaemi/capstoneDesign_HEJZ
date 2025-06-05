import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
} from 'react-native';

const SelectScreen = ({ navigation }: any) => {
  return (
    <ImageBackground
      source={require('../assets/selectbackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 상단 이미지 버튼 두 개 */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => navigation.navigate('Music')}
          >
            <Image
              source={require('../assets/MusicTown.png')}
              style={styles.icon}
            />

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => navigation.navigate('Dance')}
          >
            <Image
              source={require('../assets/DanceTown.png')}
              style={styles.icon}
            />

          </TouchableOpacity>
        </View>

        {/* 하단 커뮤니티 아이콘 */}
        <TouchableOpacity
          style={styles.communityButton}
          onPress={() => navigation.navigate('Community')}
        >
          <Image
            source={require('../assets/communityTown.png')}
            style={styles.communityIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default SelectScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 60,
  },
  row: {
    flexDirection: 'row',
    gap: 32,
  },
  iconWrapper: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  icon: {
    width: 140,
    height: 140,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  communityButton: {
    position: 'absolute',
    bottom: -50, // 화면 아래에서 얼마나 띄울지 (원하면 더 높이 올리기)
    alignSelf: 'center',
  },
  communityIcon: {
    width: 270,
    height: 270,
    resizeMode: 'contain',
  },
});
