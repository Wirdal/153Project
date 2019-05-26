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
import { EThree } from '@virgilsecurity/e3kit'; // Their SDK

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const BG_IMAGE = require('../assets/images/backgroundLogin.jpg');
// Our API stuff
const CLOUD_FUNCTION_ENDPOINT = 'https://us-central1-ecs153-chat.cloudfunctions.net/api/virgil-jwt' //The link to the API calls
const db = firebase.firestore();

// Enable LayoutAnimation on Android
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

// FUNCTIONS FOR VIRGIL
// Initialization callback that returns a Virgil json web token string from the E3kit firebase function
async function fetchToken(authToken) {
  const response = await fetch(
      CLOUD_FUNCTION_ENDPOINT,
      {
          headers: new Headers({
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
          })
      },
  );
  if (!response.ok) {
      throw `Error code: ${response.status} \nMessage: ${response.statusText}`;
    }
  return response.json().then(data => data.token);
};
// Once Firebase user authenticated, we wait for eThree client initialization
let eThreePromise = new Promise((resolve, reject) => {
  firebase.auth().onAuthStateChanged(user => {
      if (user) {
          const getToken = () => user.getIdToken().then(fetchToken); // Fetch the token of the user
          eThreePromise = EThree.initialize(getToken); // Init it 
          eThreePromise.then(resolve).catch(reject);
      }
  });
});

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
 // Everything within is an object
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
    // Sets up the begining states of messages
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
  // Transitions between login and signup
  selectCategory(selectedCategory) {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      selectedCategory,
      isLoading: false,
    });
  }

  // Regex to run email through
  verifyEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return re.test(email);
  }

  // Checks to make sure username is legal
  verifyUsername(username) {
    const valid = username.length > 0;
    this.setState({ usernameValid: valid });

    if (!valid) {
      this.usernameInput.shake();
    }

    return valid;
  }
  // The callback fn for when the button is presssed in login mode
  login() {
    // Get the email and password from the state of inputs
    const { email, password } = this.state;
    const { navigation } = this.props;
    this.setState({ isLoading: true });
    // Send it back to firebase
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .then(() => {
	navigation.goBack();
      }).catch((error) => {
	this.setState({ errorMessage: error.message });
	this.setState({ isLoading: false });
      });
  }
  // Callback fn for button when not in login state
  signUp() {
    // Grab the info from the state
    const { username, email, password } = this.state;
    // Tell app we are going to process
    this.setState({ isLoading: true });

    // Validate input
    if (!(this.validatePassword() && this.validateEmail())) {
      this.setState({ isLoading: false });
      return;
    }
    // Get the collection from our database, the users one to be exact
    const usersRef = db.collection('users');
    // Does something idk
    const { navigation } = this.props;


    // Look through the username fields of the collection, and find the one that matches userinput
    usersRef.where('username', '==', username).get()
      .then((querySnapshot) => { // Get a snapshot of it
        if (querySnapshot.size > 0) { //If it is anything, we can't do it 
	  this.setState({
	    isLoading: false,
	    errorMessage: 'A user with this username already exists.',
	  });
          return;
        }
        // Otherwise, start with creation
        firebase.auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            console.log("Before regist")
            eThreePromise.then(eThree => {
              eThree.register()
            }).catch((error) => {
              console.log(error)
            })
            console.log("after regis")
          }).catch((error) => {
            console.log(error);
          })
          // Also create jwt keys here
          .then(({ user }) => {
            usersRef.doc(user.uid).set({ // Write the username to the db
              username,
            }).then(() => {
              navigation.goBack(); // Go back to the a different page
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

  // Validation of username
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
  // Validate username, just gets it from the state
  validateUsername() {
    const { username } = this.state;

    const valid = this.verifyUsername(username);
    this.setState({ isUsernameValid: valid });

    if (!valid) {
      this.usernameInput.shake();
    }

    return valid;
  }
  // Ditto of validateUser. Get the email and check it
  validateEmail() {
    const { email } = this.state;

    const valid = this.verifyEmail(email);
    this.setState({ isEmailValid: valid });

    if (!valid) {
      this.emailInput.shake();
    }

    return valid;
  }


  // Render the login screen
  // Does not matter, for my purposes


  
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
