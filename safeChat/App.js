import React, { Component } from 'react';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import { Font } from 'expo';
import { View, YellowBox } from 'react-native';

import LoginScreen from './screens/LoginScreen';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import TabNavigator from './screens/TabNavigator';
import SearchScreen from './screens/SearchScreen';

YellowBox.ignoreWarnings(['Setting a timer']);
const AppNavigator = createStackNavigator({
  Splash: { screen: SplashScreen },
  Login: { screen: LoginScreen },
  Main: { screen: TabNavigator },
  Home: { screen: HomeScreen },
  Search: { screen: SearchScreen },
}, {
  headerLayoutPreset: 'center',
});

const AppContainer = createAppContainer(AppNavigator);

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fontLoaded: false,
    };
  }

  async componentDidMount() {
    await Font.loadAsync({
      georgia: require('./assets/fonts/Georgia.ttf'),
      regular: require('./assets/fonts/Montserrat-Regular.ttf'),
      light: require('./assets/fonts/Montserrat-Light.ttf'),
    });

    this.setState({ fontLoaded: true });
  }

  render() {
    const { fontLoaded } = this.state;

    if (fontLoaded) {
      return (
	<View style={{ flex: 1 }}>
	  <AppContainer />
	</View>
      );
    }

    return <View />;
  }
}
