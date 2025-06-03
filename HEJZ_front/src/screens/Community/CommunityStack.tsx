// 커뮤니티 관련 스크린 관리 스택
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommunityScreen from './CommunityScreen';
import MyPageOptionsScreen from './MypageOptionScreen';
import MyCommentsScreen from './MyCommentsScreen';
import MySongsScreen from './MySongScreen';
import MyVideosScreen from './MyViedoScreen';
import EditProfileScreen from './EditProfileScreen';
import EditPasswordScreen from './EditPasswordScreen';
import SignUpScreen from './SignUpScreen';
import FeedsScreen from './FeedsScreen';
import BlockedUserScreen from './BlockedUserScreen';
import BookmarkScreen from './BookmarkScreen';
import LoginScreen from './LoginScreen'

const Stack = createNativeStackNavigator();

export const CommunityNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Community" component={CommunityScreen} />
    <Stack.Screen name="Feeds" component={FeedsScreen} />
    <Stack.Screen name="Bookmark" component={BookmarkScreen} />
    <Stack.Screen name="Comments" component={MyCommentsScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="BlockedUser" component={BlockedUserScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
    <Stack.Screen name="MyVideos" component={MyViedoScreen} />
    <Stack.Screen name="MySongs" component={MySongsScreen} />
    <Stack.Screen name="MyPageOptions" component={MyCommentsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="EditPassword" component={EditPasswordScreen} />
  </Stack.Navigator>
);

export default CommunityNavigator;