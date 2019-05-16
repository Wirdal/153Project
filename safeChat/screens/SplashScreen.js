import React, { Component } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Image,
  View,
} from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';
import firebase from '../config';

const BG_IMAGE = require('../assets/images/backgroundLogin.jpg');
const LOADING_ICON = require('../assets/images/loadingIcon.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    flex: 1,
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

class SplashScreen extends Component {
  static navigationOptions = { header: null }

  componentDidMount() {
    const { navigation } = this.props;

    firebase.auth().onAuthStateChanged((user) => {
      const actions = [];
      if (user) {
        actions.push(
          NavigationActions.navigate({
            routeName: 'Main', key: user.uid, params: { userID: user.uid },
          }),
        );
      } else {
        actions.push(
          NavigationActions.navigate({
            routeName: 'Login',
          }),
        );
      }
      const resetAction = StackActions.reset({
        index: 0,
        actions,
      });
      navigation.dispatch(resetAction);
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <ImageBackground source={BG_IMAGE} style={styles.bgImage}>
          <Image source={LOADING_ICON} />
          <ActivityIndicator color="#cccccc" size="large" />
        </ImageBackground>
      </View>
    );
  }
}

export default SplashScreen;
