import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainScreen from './screens/MainScreen';
import LoginScreen from './screens/LoginScreen';
import SongScreen from './screens/SongScreen';
import DanceScreen from './screens/DanceScreen';
import { enableScreens } from 'react-native-screens';
import FeedScreen from './screens/FeedsScreen';
import MyPageOptionsScreen from './screens/MypageOptionScreen';
import MySongsScreen from './screens/MySongScreen';
import MyVideosScreen from './screens/MyViedoScreen';
import StatsScreen from './screens/StatesScreen';
import MyCommentsScreen from './screens/MyCommentsScreen';
import SelectScreen from './screens/SelectScreen';
import CommunityScreen from './screens/CommunityScreen';
import LikedScreen from './screens/LikedScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import { UserProvider } from './screens/UserContext';

enableScreens(); 

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <UserProvider> {/* 전역 사용자 상태 감싸기 */}
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Song" component={SongScreen} />
          <Stack.Screen name="Dance" component={DanceScreen} />
          <Stack.Screen name="Feeds" component={FeedScreen} />
          <Stack.Screen name="MyPageOptions" component={MyPageOptionsScreen} />
          <Stack.Screen name="MySongs" component={MySongsScreen} />
          <Stack.Screen name="MyVideos" component={MyVideosScreen} />
          <Stack.Screen name="States" component={StatsScreen} />
          <Stack.Screen name="comments" component={MyCommentsScreen} />
          <Stack.Screen name="Select" component={SelectScreen} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="Liked" component={LikedScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};


export default App;
