import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Dimensions,
  LayoutAnimation,
  UIManager,
  KeyboardAvoidingView,
} from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import firebase from '../config';
import {Crypt, keyManager, RSA} from 'hybrid-crypto-js';
//import {keyManager} from 'hybrid-crypto-js';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const BG_IMAGE = require('../assets/images/backgroundLogin.jpg');

const db = firebase.firestore();

// Enable LayoutAnimation on Android
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

const TabSelector = ({ selected }) => {
  return (
    <View style={styles.selectorContainer}>
      <View style={selected && styles.selected} />
    </View>
  );
};

TabSelector.propTypes = {
  selected: PropTypes.bool.isRequired,
};

export default class LoginScreen extends Component {
  static navigationOptions = {
    title: '',
    headerTransparent: true,
    headerTitleStyle: {
      color: 'white',
      fontFamily: 'regular',
    },
  }

  constructor(props) {
    super(props);

    this.state = {
      email: '',
      isEmailValid: true,
      username: '',
      isUsernameValid: true,
      password: '',
      isPasswordValid: true,
      passwordConfirmation: '',
      isConfirmationValid: true,
      selectedCategory: 0,
      isLoading: false,
      errorMessage: null,
    };
  }

  selectCategory(selectedCategory) {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      selectedCategory,
      isLoading: false,
    });
  }

  verifyEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return re.test(email);
  }

  verifyUsername(username) {
    const valid = username.length > 0;
    this.setState({ usernameValid: valid });

    if (!valid) {
      this.usernameInput.shake();
    }

    return valid;
  }

  login() {
    const { email, password } = this.state;
    const { navigation } = this.props;
    this.setState({ isLoading: true });

    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
	navigation.goBack();
      }).catch((error) => {
	this.setState({ errorMessage: error.message });
	this.setState({ isLoading: false });
      });
  }

  signUp() {
    const { username, email, password } = this.state;
    this.setState({ isLoading: true });

    if (!(this.validatePassword() && this.validateEmail())) {
      this.setState({ isLoading: false });
      return;
    }

    const usersRef = db.collection('users');
    const { navigation } = this.props;

    var rsa = new RSA();

    var keys_list;

    rsa.generateKeypair(function(keypair) {

      // Callback function receives new keypair as a first argument
      var publicKey = keypair.publicKey;
      var privateKey = keypair.privateKey;

      console.log(publicKey);
      console.log(privateKey);

    }, 1024);

    /*var publicKey = "-----BEGIN PUBLIC KEY----- \n MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC7EJ1dQvGcE+uwDzyJ2VED9g+J \n 5EWM5duRv2VumeK/tzDP+55FHcORW9Hpzn2WZh0XZLNcmwcJi7O948ISWWg8ylnf \n JrNb3DooWT53x9MDQr6J8v0f+RPe/thRSLvJflH0nyxciYQEU2AfXv1omOvfZS3Y \n AbJ0Uxgh6oGE4asIbwIDAQAB \n -----END PUBLIC KEY-----";

    /var publicKey = "-----BEGIN PUBLIC KEY----- \
                    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCK2V05rB6q0+TKWMl/cXww+L0D \
                    2t2pDbERGOZzBYyw9wx+kb/iI1osUAZIMjP4MTS81n0XUS2FaPWHIRTzLmP9WJyD \
                    eHwLR/7Dhm7y9M7B20YQ9sawczbXq2MyiyVL8TA5970TQc50yexN35/xdzLQMi6W \
                    gVqqLDMBR8vwUHES+QIDAQAB \
                    -----END PUBLIC KEY-----";

    var privateKey = "-----BEGIN RSA PRIVATE KEY----- MIICXQIBAAKBgQCK2V05rB6q0+TKWMl/cXww+L0D2t2pDbERGOZzBYyw9wx+kb/i I1osUAZIMjP4MTS81n0XUS2FaPWHIRTzLmP9WJyDeHwLR/7Dhm7y9M7B20YQ9saw czbXq2MyiyVL8TA5970TQc50yexN35/xdzLQMi6WgVqqLDMBR8vwUHES+QIDAQAB AoGALCtZbK9EUjN15Ki58MC5MRrvhfpp6Q1h9n5lUNHDH8h3QQw8bkOwu8f5N55A ygNdM3VH9dLtGDN7Z7EuaO2pAMZJLQurcYnMwqYEjJ7NjWv1paDqTkz07AXtgEac +GfYN3RvLUV6NTQegT1F4uoEHrTqJ23QdI+PzcleVKHs+AECQQDQ+DmmG4Ccc462 s7ivqCVINwN74A8ogekzJwDKFUqx/4BN3Y5IQrqXA9W33wIDOzn9Tfu+4p4MhWgh FK5cqxRRAkEAqhklnKL7k2Yd/KJwpqvdSuqvrvdW7+XwTRdg2zoPufnrNw2rOq6R Woym94f09JGDCb3f0bJepAuLFtl3yCMyKQJAX+CT6q+RqbanUxJQeV+ng2OiWJKr wcUhLtQFW7K7K8Hzp0YxAtyC6cjbpNpP/RWOfLbr+1/UbiBDb3IisefYkQJBAJ9H xwGjWQMQ17mvft+EBkfV9cdYk483eUsnPiprdziGf6zg3tunhjMNjHg0VrwB2nvv 0jux1I+2w3sVDuZZlukCQQClzsS2ZlWb3QBPsQRlgYhh2ov8M87ebHF0yflTZZCc 0PQ6ejZ2GfgvsHlM18noL9vf4E18DxQBRJRdVjJoJyF1 -----END RSA PRIVATE KEY-----";

    var privateKey = "-----BEGIN RSA PRIVATE KEY----- \
                      MIICWwIBAAKBgQC7EJ1dQvGcE+uwDzyJ2VED9g+J5EWM5duRv2VumeK/tzDP+55F \
                      HcORW9Hpzn2WZh0XZLNcmwcJi7O948ISWWg8ylnfJrNb3DooWT53x9MDQr6J8v0f \
                      +RPe/thRSLvJflH0nyxciYQEU2AfXv1omOvfZS3YAbJ0Uxgh6oGE4asIbwIDAQAB \
                      AoGACcGSE30cUMGRNzt0MtRMr2Iz6UMohXKvguhyh9QqyUjqmM5MsNoeiwQ47HLC \
                      hgeJWOD9ocTMFylcFHk+c+qJzxrG2SdjzI9eriyu2Y2ayPAKyRZcCJf+tyf+ixTi \
                      /PqtJGbniRHEJbcn6S/xBXe1/pzelP/Bf94JGIl5LuYI5YECQQD8k1oRLwF6kgun \
                      8k+Qjr3uBmf55aDM8jYOtq8nbGdOBCqiaSosEKW5mxU7VqtBb+yQ8yfCn4oYOn/L \
                      0SZOXs4hAkEAvZni1ogaCCLUFu6EdKhLHGrA+EJETP0GDrZMo8bHxmO6Z7iQMGvE \
                      0CxfYkAGPLYLewL5eI7S5Y9ltbQWIhFkjwJADot1vlOUpDhQz4UWq95sdY6M4kkk \
                      72hrUIGYqI6HjGiVA/FGam8y+/NAT8B38Da/ysEV4xFI5IhJ37TVneG7wQJAZ8pp \
                      5s6ykWmfeL4xPDs0guXdpQmBojOQsVUSN0WF7xCA5m6eYCNepibkQECUKX/uYPSL \
                      5Hcq9Ae/wexHgXbL+QJAY7mXz2vPLEibmLWxLAck2nV1/q1d5bv5NY8ENrbj/Ebg \
                      Zv5786zyndUP4s+aNiE9m6Kldq6Tv6WvAZ1lPoLZZA== \
                      -----END RSA PRIVATE KEY-----";


    // Get device specific RSA key pair
    keyManager.getKeys(function(keypair) {

        // Callback function receives new keypair as a first argument
        var publicKey = keypair.publicKey;
        var privateKey = keypair.privateKey;
        console.log('Public Key');
        console.log(publicKey);
    }, 1024);*/



    usersRef.where('username', '==', username).get()
      .then((querySnapshot) => {
        if (querySnapshot.size > 0) {
      	  this.setState({
      	    isLoading: false,
      	    errorMessage: 'A user with this username already exists.',
      	  });
          return;
        }

        firebase.auth()
          .createUserWithEmailAndPassword(email, password)
          .then(({ user }) => {

            usersRef.doc(user.uid).set({
              username, privateKey, publicKey
              //this is where i want to push the private key and public key
            })
            .then(() => {
              navigation.goBack();
            }).catch((error) => {
      	      this.setState({
            	   errorMessage: error.message,
            	   isLoading: false,
      	      });
            });
      	  }).catch(error => this.setState({
      	    errorMessage: error.message,
      	    isLoading: false,
      	  }));
      });
  }

  validatePassword() {
    const { password, passwordConfirmation } = this.state;

    const valid = password.length > 0;
    this.setState({ isPasswordValid: valid });

    if (!valid) {
      this.passwordInput.shake();
      return false;
    }

    const validConfirmation = password === passwordConfirmation;
    this.setState({ isConfirmationValid: validConfirmation });

    if (!validConfirmation) {
      this.confirmationInput.shake();
    }

    return validConfirmation;
  }

  validateUsername() {
    const { username } = this.state;

    const valid = this.verifyUsername(username);
    this.setState({ isUsernameValid: valid });

    if (!valid) {
      this.usernameInput.shake();
    }

    return valid;
  }

  validateEmail() {
    const { email } = this.state;

    const valid = this.verifyEmail(email);
    this.setState({ isEmailValid: valid });

    if (!valid) {
      this.emailInput.shake();
    }

    return valid;
  }

  render() {
    const {
      selectedCategory,
      isLoading,
      isEmailValid,
      isUsernameValid,
      isPasswordValid,
      isConfirmationValid,
      email,
      username,
      password,
      passwordConfirmation,
      errorMessage,
    } = this.state;
    const isLoginPage = selectedCategory === 0;
    const isSignUpPage = selectedCategory === 1;
    return (
      <View style={styles.container}>
	<ImageBackground source={BG_IMAGE} style={styles.bgImage}>
	  <View>
	    <KeyboardAvoidingView
	      contentContainerStyle={styles.loginContainer}
	      behavior="position"
	    >
	      <View style={styles.titleContainer}>
		<View style={{ flexDirection: 'row' }}>
		  <Text style={styles.titleText}>SAFE</Text>
		</View>
		<View style={{ marginTop: -10, marginLeft: 10 }}>
		  <Text style={styles.titleText}>CHAT</Text>
		</View>
	      </View>
	      <View style={{ flexDirection: 'row' }}>
		<Button
		  disabled={isLoading}
		  type="clear"
		  activeOpacity={0.7}
		  onPress={() => this.selectCategory(0)}
		  containerStyle={{ flex: 1 }}
		  titleStyle={[
		    styles.categoryText,
		    isLoginPage && styles.selectedCategoryText,
		  ]}
		  title={'Login'}
		/>
		<Button
		  disabled={isLoading}
		  type="clear"
		  activeOpacity={0.7}
		  onPress={() => this.selectCategory(1)}
		  containerStyle={{ flex: 1 }}
		  titleStyle={[
		    styles.categoryText,
		    isSignUpPage && styles.selectedCategoryText,
		  ]}
		  title={'Sign up'}
		/>
	      </View>
	      <View style={styles.rowSelector}>
		<TabSelector selected={isLoginPage} />
		<TabSelector selected={isSignUpPage} />
	      </View>
	      <View style={styles.formContainer}>
		<Input
		  leftIcon={
		    <Icon
		      name="envelope-o"
		      type="font-awesome"
		      color="rgba(0, 0, 0, 0.38)"
		      size={25}
		      style={{ backgroundColor: 'transparent' }}
		    />
		  }
		  value={email}
		  keyboardAppearance="light"
		  autoFocus={false}
		  autoCapitalize="none"
		  autoCorrect={false}
		  keyboardType="email-address"
		  returnKeyType="next"
		  inputStyle={{ marginLeft: 10 }}
		  placeholder={'Email'}
		  containerStyle={{
		    borderBottomColor: 'rgba(0, 0, 0, 0.38)',
		  }}
		  ref={input => (this.emailInput = input)}
		  onSubmitEditing={() => {
		    this.validateEmail();
		    if (isSignUpPage) {
		      this.usernameInput.focus()
		    } else {
		      this.passwordInput.focus();
		    }
		  }}
		  onChangeText={email => this.setState({ email })}
		  errorMessage={
		    isEmailValid ? null : 'Please enter a valid email address'
		  }
		/>
		{isSignUpPage && (
		<Input
		  leftIcon={
		    <Icon
		      name="user"
		      type="font-awesome"
		      color="rgba(0, 0, 0, 0.38)"
		      size={25}
		      style={{ backgroundColor: 'transparent' }}
		    />
		  }
		  value={username}
		  keyboardAppearance="light"
		  autoFocus={false}
		  autoCapitalize="none"
		  autoCorrect={false}
		  returnKeyType="next"
		  inputStyle={{ marginLeft: 10 }}
		  placeholder={'Username'}
		  containerStyle={{
		    marginTop: 16,
		    borderBottomColor: 'rgba(0, 0, 0, 0.38)',
		  }}
		  ref={input => (this.usernameInput = input)}
		  onSubmitEditing={() => {
		    this.validateUsername();
		    this.passwordInput.focus();
		  }}
		  onChangeText={username => this.setState({ username })}
		  errorMessage={
		    isUsernameValid ? null : 'Please enter a valid username address'
		  }
		/>
		)}
		<Input
		  leftIcon={
		    <Icon
		      name="lock"
		      type="simple-line-icon"
		      color="rgba(0, 0, 0, 0.38)"
		      size={25}
		      style={{ backgroundColor: 'transparent' }}
		    />
		  }
		  value={password}
		  keyboardAppearance="light"
		  autoCapitalize="none"
		  autoCorrect={false}
		  secureTextEntry={true}
		  returnKeyType={isSignUpPage ? 'next' : 'done'}
		  blurOnSubmit={true}
		  containerStyle={{
		    marginTop: 16,
		    borderBottomColor: 'rgba(0, 0, 0, 0.38)',
		  }}
		  inputStyle={{ marginLeft: 10 }}
		  placeholder={'Password'}
		  ref={input => (this.passwordInput = input)}
		  onSubmitEditing={() =>
		      isSignUpPage
			? this.confirmationInput.focus()
			: this.login()
		  }
		  onChangeText={password => this.setState({ password })}
		  errorMessage={
		    isPasswordValid
		      ? null
		      : 'Please enter at least 6 characters'
		  }
		/>
		{isSignUpPage && (
		  <Input
		    leftIcon={
		      <Icon
			name="lock"
			type="simple-line-icon"
			color="rgba(0, 0, 0, 0.38)"
			size={25}
			style={{ backgroundColor: 'transparent' }}
		      />
		    }
		    value={passwordConfirmation}
		    secureTextEntry={true}
		    keyboardAppearance="light"
		    autoCapitalize="none"
		    autoCorrect={false}
		    keyboardType="default"
		    returnKeyType={'done'}
		    blurOnSubmit={true}
		    containerStyle={{
		      marginTop: 16,
		      borderBottomColor: 'rgba(0, 0, 0, 0.38)',
		    }}
		    inputStyle={{ marginLeft: 10 }}
		    placeholder={'Confirm password'}
		    ref={input => (this.confirmationInput = input)}
		    onSubmitEditing={() => this.signUp()}
		    onChangeText={passwordConfirmation =>
			this.setState({ passwordConfirmation })
		    }
		    errorMessage={
		      isConfirmationValid
			? null
			: 'Please enter the same password'
		    }
		  />
		)}
		{errorMessage
		    && <Text style={[styles.error]}>{errorMessage}</Text>
		}
		<Button
		  buttonStyle={styles.loginButton}
		  containerStyle={{ marginTop: 32, flex: 0 }}
		  linearGradientProps={{
		    colors: ['#FF9800', '#F44336'],
		    start: [1, 0],
		    end: [0.2, 0],
		  }}
		  activeOpacity={0.8}
		  title={isLoginPage ? 'LOGIN' : 'SIGN UP'}
		  onPress={() => isLoginPage ? this.login() : this.signUp()}
		  titleStyle={styles.loginTextButton}
		  loading={isLoading}
		/>
	      </View>
	    </KeyboardAvoidingView>
      </View>
      </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowSelector: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorContainer: {
    flex: 1,
    alignItems: 'center',
  },
  selected: {
    position: 'absolute',
    borderRadius: 50,
    height: 0,
    width: 0,
    top: -5,
    borderRightWidth: 70,
    borderBottomWidth: 70,
    borderColor: 'white',
    backgroundColor: 'white',
  },
  loginContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginTextButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'rgba(232, 206, 142, 1)',
    borderRadius: 10,
    height: 50,
    width: 200,
  },
  titleContainer: {
    height: 150,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    width: SCREEN_WIDTH - 30,
    borderRadius: 10,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
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
  categoryText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 24,
    fontFamily: 'light',
    backgroundColor: 'transparent',
    opacity: 0.54,
  },
  selectedCategoryText: {
    opacity: 1,
  },
  titleText: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'regular',
  },
  helpContainer: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: 'regular',
    color: 'red',
    textAlign: 'center',
    fontSize: 12,
  },
});

// Source: https://github.com/react-native-elements/react-native-elements-app/blob/master/src/views/login/screen3.js
