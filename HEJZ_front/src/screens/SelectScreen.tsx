import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
} from 'react-native';
import BottomBar from './BottomBar';

const SelectScreen = ({ navigation }: any) => {
  return (
    <View style={styles.screen}>
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
              onPress={() =>
                navigation.navigate('Dance', { screen: 'DanceScreen' })
              }
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

      {/* ✅ 하단 바 추가 */}
      <BottomBar />
    </View>
  );
};

export default SelectScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
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
  communityButton: {
    position: 'absolute',
    bottom: -50,
    alignSelf: 'center',
  },
  communityIcon: {
    width: 270,
    height: 270,
    resizeMode: 'contain',
  },
});
