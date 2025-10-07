// 커뮤니티 관련 스크린 관리 스택
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommunityScreen from './CommunityScreen';
import MyPageOptionsScreen from './MypageOptionScreen';
import MyCommentsScreen from './MyCommentsScreen';
import MySongScreen from './MySongScreen';
import MyVideoScreen from './MyViedoScreen';
import EditProfileScreen from './EditProfileScreen';
import EditPasswordScreen from './EditPasswordScreen';
import SignUpScreen from './SignUpScreen';
import FeedsScreen from './FeedsScreen';
import BlockedUserScreen from './BlockedUserScreen';
import BookmarkScreen from './BookmarkScreen';

import MyRoomScreen from './MyRoomScreen';
import ComposeFeedScreen from'./ComposeFeedScreen';
import FeedDetailScreen from './FeedDetailScreen';
import FeedCreateScreen from './FeedCreateScreen';
const Stack = createNativeStackNavigator();

export const CommunityNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Community" component={CommunityScreen} />
    <Stack.Screen name="Feeds" component={FeedsScreen} />
    <Stack.Screen name="Bookmark" component={BookmarkScreen} />
    <Stack.Screen name="Comments" component={MyCommentsScreen} />

    <Stack.Screen name="BlockedUser" component={BlockedUserScreen} />
    <Stack.Screen name="MyVideos" component={MyVideoScreen} />
    <Stack.Screen name="MySongs" component={MySongScreen} />
    <Stack.Screen name="MyPageOptions" component={MyPageOptionsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="EditPassword" component={EditPasswordScreen} />
    <Stack.Screen name="MyRoom" component={MyRoomScreen} />
    <Stack.Screen name="ComposeFeed" component={ComposeFeedScreen} />
    <Stack.Screen name="FeedDetail" component={FeedDetailScreen} />
    <Stack.Screen name="FeedCreate" component={FeedCreateScreen} />
  </Stack.Navigator>
);

export default CommunityNavigator;