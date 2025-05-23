import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { API_URL, API_SUNO_KEY } from '@env';
import { ApiContext } from './context/ApiContext';

import MainScreen from './screens/MainScreen';
import LoginScreen from './screens/Community/LoginScreen';
import SongScreen from './screens/Song/SongScreen';
import DanceScreen from './screens/Dance/DanceScreen';
import { enableScreens } from 'react-native-screens';
import FeedScreen from './screens/Community/FeedsScreen';
import MyPageOptionsScreen from './screens/Community/MypageOptionScreen';
import MySongsScreen from './screens/Community/MySongScreen';
import MyVideosScreen from './screens/Community/MyViedoScreen';
import StatsScreen from './screens/StatesScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import MyCommentsScreen from './screens/Community/MyCommentsScreen';
import SignUpScreen from './screens/Community/SignUpScreen';
import SelectScreen from './screens/SelectScreen';
enableScreens(); 

const Stack = createNativeStackNavigator();

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Ramche: require('./assets/fonts/Ramche.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>폰트 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <UserProvider>
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
