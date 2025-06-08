import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import * as Font from 'expo-font';
import { API_URL, API_SUNO_KEY } from '@env';
import { ApiContext } from './context/ApiContext';
import { UserProvider } from './context/UserContext';

import MainScreen from './screens/MainScreen';
import SongScreen from './screens/Song/SongScreen';
import DanceNavigator from './screens/Dance/DanceStack';
import { enableScreens } from 'react-native-screens';
import CommunityNavigator from './screens/Community/CommunityStack';
import StatsScreen from './screens/StatesScreen';
import SelectScreen from './screens/SelectScreen';
import SignUpScreen from './screens/SignUpScreen';
import SongPlayScreen from './screens/Community/SongPlayScreen';



enableScreens(); 

const Stack = createNativeStackNavigator();

const App = () => {
//   const [fontsLoaded, setFontsLoaded] = useState(false);
//
//   useEffect(() => {
//     Font.loadAsync({
//       Ramche: require('./assets/Ramche.ttf'),
//     }).then(() => setFontsLoaded(true));
//   }, []);
//
//   if (!fontsLoaded) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>폰트 불러오는 중...</Text>
//       </View>
//     );
//   }

  return (
          <ApiContext.Provider value={{ apiUrl: API_URL, apiKey: API_SUNO_KEY }}>
            <UserProvider>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Main" component={MainScreen} />
                  <Stack.Screen name="Stats" component={StatsScreen} />
                  <Stack.Screen name="Select" component={SelectScreen} />
                  <Stack.Screen name="SignUp" component={SignUpScreen} />
                  {/* 각 기능 스택 연결 */}
                  <Stack.Screen name="Music" component={SongScreen} />
                  <Stack.Screen name="Dance" component={DanceNavigator} />
                  <Stack.Screen name="Community" component={CommunityNavigator} />
                  <Stack.Screen name="SongPlay" component={SongPlayScreen} />


                </Stack.Navigator>

              </NavigationContainer>
            </UserProvider>
          </ApiContext.Provider>
  );
};

export default App;
