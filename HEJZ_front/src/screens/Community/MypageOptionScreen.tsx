import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // For navigation
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Type import
import LinearGradient from 'react-native-linear-gradient'; // For gradient
import * as Animatable from 'react-native-animatable'; // For animation

// Define Stack Navigator parameters for navigation types
type RootStackParamList = {
  MySongs: undefined;
  MyVideos: undefined;
  Liked: undefined;
  comments: undefined;
  States: undefined;
};

// Set type for useNavigation
const MyPageOptionsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ImageBackground
      source={require('../../assets/mainbackground.png')} // U-STAR background image
      style={styles.background}
    >
      <LinearGradient
        colors={['rgba(135, 206, 235, 0.8)', 'rgba(255, 182, 193, 0.8)']} // Soft sky blue to pink gradient
        style={styles.overlay}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <Animatable.Text
            animation="fadeInDown"
            duration={1000}
            style={styles.header}
          >
            설정
          </Animatable.Text>

          {/* Rectangular buttons with uniform size */}
          <Animatable.View animation="bounceIn" delay={300}>
            <TouchableOpacity style={styles.rectButton} onPress={() => navigation.navigate('MySongs')}>
              <LinearGradient
                colors={['#FF69B4', '#9370DB']}
                style={styles.rectGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>내가 만든 노래</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="bounceIn" delay={400}>
            <TouchableOpacity style={styles.rectButton} onPress={() => navigation.navigate('MyVideos')}>
              <LinearGradient
                colors={['#FF69B4', '#9370DB']}
                style={styles.rectGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>내가 만든 영상</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="bounceIn" delay={500}>
            <TouchableOpacity style={styles.rectButton} onPress={() => navigation.navigate('Liked')}>
              <LinearGradient
                colors={['#FF69B4', '#9370DB']}
                style={styles.rectGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>좋아요 목록</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="bounceIn" delay={600}>
            <TouchableOpacity style={styles.rectButton} onPress={() => navigation.navigate('comments')}>
              <LinearGradient
                colors={['#FF69B4', '#9370DB']}
                style={styles.rectGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>내 댓글</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="bounceIn" delay={700}>
            <TouchableOpacity style={styles.rectButton} onPress={() => navigation.navigate('States')}>
              <LinearGradient
                colors={['#FF69B4', '#9370DB']}
                style={styles.rectGradient}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>내 콘텐츠 통계</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
};

export default MyPageOptionsScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  rectButton: {
    width: 320, // Fixed uniform width
    height: 50, // Increased uniform height for full text visibility
    borderRadius: 30, // Rounded edges for a rectangular shape
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    overflow: 'visible',
  },
  rectGradient: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});