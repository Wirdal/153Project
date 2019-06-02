import React from 'react'
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat'
import KeyboardSpacer from 'react-native-keyboard-spacer';
import firebase from '../config';
import eThreePromise from '../ethree';

const db = firebase.firestore();

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

class ChatScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: navigation.state.params.title,
    headerTintColor: '#FF7500',
    headerStyle: {
      backgroundColor: '#2C3238', // header bg color
    },
    headerBackTitle: ' ',
    headerTitleStyle: {
      color: 'white',
    },
  })

  constructor({ navigation }) {
    super()
    const appUser = firebase.auth().currentUser.uid,
      peerID = navigation.state.params.user.userID

    this.state = {
      messages: [],
      loading: true,
      appUserName: '',
      peerUserName: '',
    }

    this.appUser = appUser
    this.peerID = peerID
    this.participantsString = [appUser, peerID].sort().join(',')

    this.messagesRef = db.collection('messages').where('participants', '==', this.participantsString)
    this.unsubscribe = null
  }

  async componentWillMount() {
    const { appUser, peerID } = this;

    // Get the usernames from the database
    const appUserDoc = await db.collection('users').doc(appUser).get()
    const peerDoc = await db.collection('users').doc(peerID).get()

    this.eThree = await eThreePromise;
    const usersToEncryptTo = [...new Set([appUser, peerID])];
    let publicKeys
    try {
      publicKeys = await this.eThree.lookupPublicKeys(usersToEncryptTo);
    } catch(err) {
      console.error(err.lookupResult)
    }

    this.setState({
      appUserName: appUserDoc.data().username,
      peerUserName: peerDoc.data().username,
      publicKeys,
    });

    this.unsubscribe = this.messagesRef.onSnapshot(this.onMessagesUpdate.bind(this));
  }

  createChat(user1, user2) {
    const leftRef = db.collection('chats').doc(user1.id)
    const leftChat = {
      id: user2.id,
      username: user2.username,
      timestamp: Date.now(),
    };
    leftRef.get()
      .then(docSnapshot => {
        if (docSnapshot.exists) {
          const current = docSnapshot.data().active
          leftRef.update({
            active: current.filter(({ id }) => id !== leftChat.id ).concat(leftChat),
          });
        } else {
          leftRef.set({
            active: [leftChat],
          });
        }
      });
  }

  async onSend(messages = []) {
    if (messages.length === 0) { return }

    const { eThree, appUser, peerID, participantsString } = this;
    const { appUserName, peerUserName, publicKeys } = this.state;

    const message = messages[0];

    const t = Date.now()
    const encryptedMessage = await eThree.encrypt(message.text, publicKeys);
    console.log("encrypting time: ", Date.now() - t)
    db.collection('messages').add({
      message: encryptedMessage,
      senderID: appUser,
      senderName: appUserName,
      participants: participantsString,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const appUserObj = { id: appUser, username: appUserName }
    const peerUserObj = { id: peerID, username: peerUserName }
    this.createChat(appUserObj, peerUserObj)
    this.createChat(peerUserObj, appUserObj)
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async onMessagesUpdate(querySnapshot) {
    const encryptedMessages = [];
    querySnapshot.docChanges().forEach(function(change) {
      if (change.type === "added") {
        let {
          senderID, senderName, message, timestamp
        } = change.doc.data();

        if (!timestamp) {
          timestamp = Date.now()
        } else {
          timestamp = timestamp.toDate()
        }

        encryptedMessages.push({
          _id: change.doc.id,
          text: message,
          createdAt: timestamp,
          user: {
            _id: senderID,
            name: senderName
          }
        });
      }

      // messages cannot be edited or removed yet
      // if (change.type === "removed") { }
      // if (change.type === "modified") { }
    });

    const eThree = this.eThree;
    const messages = [...this.state.messages]
    const publicKeys = this.state.publicKeys;

    for (const encryptedMessage of encryptedMessages) {
      try {
        const publicKey = publicKeys[encryptedMessage.user._id];
        const t = Date.now()
        const decryptedText = await eThree.decrypt(encryptedMessage.text, publicKey);
        console.log(`Decrypted message: ${decryptedText} in ${Date.now() - t} ms. `)
        const message = { ...encryptedMessage, text: decryptedText }

        messages.push(message);
      } catch (e) {
        console.log(`Could not decrypt message from ${encryptedMessage.user._id}: ${e}`)
      }
    }

    const sortedMessages = messages.sort((a, b) => (b.createdAt - a.createdAt));

    this.setState({
      messages: sortedMessages,
      loading: false,
    });
  }

  render() {
    const { loading } = this.state
    return (loading ?
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF7500" />
      </View>
      :
      <View style={{flex: 1}}>
        <GiftedChat
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: this.appUser,
          }}
          textStyle={{color: '#FF7500'}}
          renderBubble={props => {
            return (
              <Bubble
                {...props}
                wrapperStyle={{
                  right: {
                    backgroundColor: '#FF7500',
                  },
                }}
              />
            );
          }}
        />
        {Platform.OS === 'android' ? <KeyboardSpacer /> : null }
      </View>
    )
  }
}

export default ChatScreen
