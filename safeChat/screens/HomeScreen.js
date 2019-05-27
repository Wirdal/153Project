import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  FlatList,
} from 'react-native';
import { ListItem } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackActions, NavigationActions } from 'react-navigation';
import firebase from '../config';
import UserAvatar from 'react-native-user-avatar';

const db = firebase.firestore();

export default class HomeScreen extends React.Component {
  static handleLogout = ({ navigation }) => {
    firebase.auth().signOut().then(() => {
      const resetAction = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName: 'Login' })],
      });
      navigation.dispatch(resetAction);
    });
  }

  static navigationOptions = props => ({
    tabBarIcon: ({ tintColor }) => (<Icon name="home" size={24} color={tintColor} />),
    title: 'Home',
  })

  openChatWith(user) {
    const { navigation } = this.props
    navigation.push('Chat', { title: user.username, user });
  }

  constructor() {
    super()

    this.state = {
      chats: [],
    }

    this.appUser = firebase.auth().currentUser.uid
    this.appUserName = ''
    db.collection('users').doc(this.appUser).get()
      .then((userDoc) => {
        this.appUserName = userDoc.data().username
      }).catch((error) => {
        console.log(error);
        console.log(this.appUser);
      })
    this.chatsRef = db.collection('chats').doc(this.appUser)
    this.unsubscribe = null
  }

  componentWillMount() {
    this.unsubscribe = this.chatsRef.onSnapshot(this.onChatUpdate.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onChatUpdate(doc) {
    if (!doc.data()) { return }

    const chats = [];

    let { active } = doc.data();
    if (!active) { return }

    active.forEach((chat) => {
      if (!chat.timestamp) {
        timestamp = Date.now()
      } else {
        timestamp = chat.timestamp
      }

      chats.push({
        id: chat.id,
        username: chat.username,
        timestamp: timestamp,
      });
    })

    const sortedChats = chats.sort((a, b) => (b.timestamp - a.timestamp));

    this.setState({ chats: sortedChats });
  }

  render() {
    const { chats } = this.state

    return (
      <View style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <FlatList
            data={chats}
            keyExtractor={item => item.id}
            renderItem={({ item }) =>
                <ListItem
                  leftElement={
                    <UserAvatar name={item.username.slice(0, 2).toUpperCase()} size={50} />
                  }
                  onPress={() => this.openChatWith({ userID: item.id, username: item.username })}
                  title={item.username}
                  chevron
                />
            }
          />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
