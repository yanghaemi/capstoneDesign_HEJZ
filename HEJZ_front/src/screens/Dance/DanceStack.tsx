import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DanceRecommendScreen from './DanceRecommendScreen';
import DanceScreen from './DanceScreen';

const Stack = createNativeStackNavigator();

export const DanceNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DanceRecommendScreen" component={DanceRecommendScreen} />
    <Stack.Screen name="DanceScreen" component={DanceScreen} />
  </Stack.Navigator>
);

export default DanceNavigator;