import React, { Component } from 'react';
import { createStackNavigator, createAppContainer } from 'react-navigation';
import { Font } from 'expo';
import { View, Text } from 'react-native';

import LoginScreen from './screens/LoginScreen';

const AppNavigator = createStackNavigator({
  Login: {screen: LoginScreen},
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

    return <Text>Loading...</Text>;
  }
}
