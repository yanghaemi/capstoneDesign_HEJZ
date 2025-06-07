import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MyRoomHeader from './MyRoomHeader';

const { width, height } = Dimensions.get('window');

const MyRoomScreen = () => {
  const navigation = useNavigation();

  const goToMySongs = () => {
    navigation.navigate('MySongScreen');
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView>
        <MyRoomHeader navigation={navigation} />
      </SafeAreaView>

      <ImageBackground
        source={require('../../assets/background/BlueRoom.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <TouchableOpacity style={styles.radioPosition} onPress={() => navigation.navigate('MySongs')}>
          <Image
            source={require('../../assets/icon/Radio.png')}
            style={styles.radioImage}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraPosition} onPress={() => navigation.navigate('MyVideos')}>
          <Image
            source={require('../../assets/icon/camera.png')}
            style={styles.cameraImage}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.albumPosition} onPress={() => navigation.navigate('Feeds')}>
          <Image
            source={require('../../assets/icon/phone.png')}
            style={styles.albumImage}
          />
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

// ✅ 함수 바깥에서 정의되어야 함!
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  radioPosition: {
    position: 'absolute',
    top: height * 0.36,
    left: width * 0.6,
  },
  cameraPosition: {
      position: 'absolute',
      top: height * 0.35,
      left: width * 0.35,
    },
albumPosition: {
      position: 'absolute',
      top: height * 0.42,
      left: width * 0.73,
    },

  radioImage: {
    width: 40,
    height: 40,
  },
  cameraImage: {
      width: 42,
      height: 42,
  },
  albumImage: {
        width: 60,
        height: 40,
  },
});

export default MyRoomScreen;
