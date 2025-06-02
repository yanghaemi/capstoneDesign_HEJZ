// import React from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ImageBackground,
// } from 'react-native';
//
// const SelectScreen = ({ navigation }: any) => {
//   return (
//     <ImageBackground
//       source={require('../assets/mainbackground.png')}
//       style={styles.background}
//       resizeMode="cover"
//     >
//       <View style={styles.container}>
//         {/* 1줄: 노래 + 안무 */}
//         <View style={styles.row}>
//           <TouchableOpacity
//             style={styles.iconWrapper}
//             onPress={() => navigation.navigate('Song')}
//           >
//             <Image source={require('../assets/SongStar.png')} style={styles.icon} />
//             <Text style={styles.label}>노래 생성</Text>
//           </TouchableOpacity>
//
//           <TouchableOpacity
//             style={styles.iconWrapper}
//             onPress={() => navigation.navigate('Dance')}
//           >
//             <Image source={require('../assets/DanceStar.png')} style={styles.icon} />
//             <Text style={styles.label}>안무 추천</Text>
//           </TouchableOpacity>
//         </View>
//
//         {/* 2줄: 둘러보기 */}
//         <TouchableOpacity
//           style={[styles.iconWrapper, { marginTop: 40 }]}
//           onPress={() => navigation.navigate('Community')}
//         >
//           <Image source={require('../assets/LookStar.png')} style={styles.icon} />
//           <Text style={styles.label}>둘러보기</Text>
//         </TouchableOpacity>
//       </View>
//     </ImageBackground>
//   );
// };
//
// export default SelectScreen;
//
// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//   },
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   row: {
//     flexDirection: 'row',
//     gap: 32,
//   },
//   iconWrapper: {
//     alignItems: 'center',
//     marginHorizontal: 20,
//   },
//   icon: {
//     width: 140,
//     height: 140,
//     marginBottom: 6,
//      resizeMode: 'contain',
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#fff',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     backgroundColor: 'rgba(0, 0, 0, 0.4)', // 텍스트 배경 처리로 가독성 ↑
//     borderRadius: 6,
//     overflow: 'hidden',
//   },
// });
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image
} from 'react-native';


const SelectScreen = ({ navigation }: any) => {
  return (
    <ImageBackground
      source={require('../assets/mainbackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* 상단 버튼 두 개 */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate('Song')}
          >
            <Text style={styles.buttonText}>노래 생성</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate('Dance')}
          >
            <Text style={styles.buttonText}>안무 추천</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 커뮤니티 아이콘 버튼 */}
        <TouchableOpacity
          style={styles.communityButton}
          onPress={() => navigation.navigate('Community')}
        >
          <Image
            source={require('../assets/CommunityStar.png')}
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
    paddingHorizontal: 24,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  mainButton: {
    flex: 1,
    backgroundColor: '#FFF5C0', // ✨ 연노랑
    paddingVertical: 30,
    borderRadius: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E2C799',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#3C2A21', // 진한 갈색 텍스트
    fontSize: 18,
    fontWeight: '700',
  },

  communityButton: {
    position: 'absolute',
    bottom: 10, // 살짝 위로 띄우기
    right: 0,
    padding: 8,
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  communityIcon: {
    width: 70, // 커진 크기
    height: 64,
  },

});
