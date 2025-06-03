// 안무 추천 페이지
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Button, ImageBackground } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ApiContext } from '../../context/ApiContext';


const DanceRecommendScreen=({route}) =>{

    const {title} = route.params;

    return (

        <ImageBackground
                          source={require('../../assets/mainbackground.png')}
                          style={styles.background}
                          resizeMode="cover"
              >


        </ImageBackground>
    );
};

export default DanceRecommendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  list: {
    marginBottom: 20,
  },
  item: {
    padding: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: '#cde1ff',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  prompt: {
    fontSize: 14,
    color: '#555',
  },
  result: {
    marginTop: 30,
    fontSize: 16,
    color: 'green',
    textAlign: 'center',
  },
  background: {
         flex: 1,
        resizeMode: 'cover',
  },
});