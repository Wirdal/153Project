import React from 'react';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackActions, NavigationActions } from 'react-navigation';

import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import firebase from '../config';

const TabNavigator = createMaterialBottomTabNavigator({
  Home: HomeScreen,
  Search: SearchScreen,
}, {
  initialRouteName: 'Home',
  activeColor: '#FF7500',
  inactiveColor: '#6B6F80',
  barStyle: { backgroundColor: '#F0F0F0'}, // bottom tab bar color
  labeled: true,
});

const handleLogout = ({ navigation }) => {
  firebase.auth().signOut().then(() => {
    const resetAction = StackActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Login' })],
    });
    navigation.dispatch(resetAction);
  });
}

TabNavigator.navigationOptions = ({ navigation }) => ({
  title: 'Safe Chat',
  headerLeft: null,
  headerTintColor: '#FF7500',
  headerStyle: {
    backgroundColor: '#2C3238', // header bg color
  },
  headerBackTitle: ' ',
  headerTitleStyle: {
    color: 'white',
  },
  // log off for now, in the future navigate to settings screen
  headerRight: (
    <Button
      onPress={() => handleLogout({ navigation })}
      icon={(
        <Icon
          name="menu"
          size={32}
          color="#FF7500"
        />
      )}
      type="clear"
    />
  ),
});

export default TabNavigator;

// Source Tutorials Used:
// https://reactnavigation.org/docs/en/material-bottom-tab-navigator.html
