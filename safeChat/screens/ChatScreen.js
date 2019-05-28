import React from 'react'
import { View, Platform, ActivityIndicator } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat'
import KeyboardSpacer from 'react-native-keyboard-spacer';
import firebase from '../config';
import eThreePromise from '../ethree';

const db = firebase.firestore();

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
    this.unsubscribe = this.messagesRef.onSnapshot(this.onMessagesUpdate.bind(this));

    // Get the usernames from the database
    const appUserDoc = await db.collection('users').doc(this.appUser).get()
    const peerDoc = await db.collection('users').doc(this.peerID).get()

    this.eThree = await eThreePromise;
    const hasPrivateKey = await this.eThree.hasLocalPrivateKey();
    if (!hasPrivateKey) {
      await this.eThree.register()
    }

    this.setState({
      appUserName: appUserDoc.data().username,
      peerUserName: peerDoc.data().username,
      loading: false,
    });
  }

  async onSend(messages = []) {
    if (messages.length === 0) {
      return
    }

    const { eThree, appUser, peerID, participantsString } = this;
    const { appUserName, peerUserName } = this.state;

    const message = messages[0];
    const usersToEncryptTo = [appUser, peerID];
    const publicKeys = await eThree.lookupPublicKeys(usersToEncryptTo); // Fails on pubkey lookup
    // Err code
    // [Unhandled promise rejection: LookupError: Failed some public keys lookups. You can see the results by calling error.lookupResult property of this error instance]

    const encryptedMessage = await eThree.encrypt(message.text, publicKeys);
    db.collection('messages').add({
      message: encryptedMessage,
      senderID: appUser,
      senderName: appUserName,
      participants: participantsString,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const leftRef = db.collection('chats').doc(appUser)
    const leftChat = {
      id: peerID,
      username: peerUserName,
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

    const rightRef = db.collection('chats').doc(peerID)
    const rightChat = {
      id: appUser,
      username: appUserName,
      timestamp: Date.now(),
    };
    rightRef.get()
      .then(docSnapshot => {
        if (docSnapshot.exists) {
          const current = docSnapshot.data().active
          rightRef.update({
            active: current.filter(({ id }) => id !== rightChat.id ).concat(rightChat),
          });
        } else {
          rightRef.set({
            active: [rightChat],
          });
        }
      });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  async onMessagesUpdate(querySnapshot) {
    const encryptedMessages = [];
    querySnapshot.forEach((doc) => {
      let {
        senderID, senderName, message, timestamp
      } = doc.data();

      if (!timestamp) {
        timestamp = Date.now()
      } else {
        timestamp = timestamp.toDate()
      }

      encryptedMessages.push({
        _id: doc.id,
        text: message,
        createdAt: timestamp,
        user: {
          _id: senderID,
          name: senderName
        }
      });
    });

    const messages = []
    const eThree = this.eThree;

    for (const encryptedMessage of encryptedMessages) {
      try {
        const publicKey = await eThree.lookupPublicKeys(encryptedMessage.user._id);
        const decryptedText = await eThree.decrypt(encryptedMessage.text, publicKey);
        const message = { ...encryptedMessage, text: decryptedText }

        messages.push(message);
      } catch (e) {
        console.log(`Could not decrypt message from ${encryptedMessage.user._id}: ${e}`)
      }
    }

    const sortedMessages = messages.sort((a, b) => (b.createdAt - a.createdAt));

    this.setState({ messages: sortedMessages });
  }

  render() {
    const { loading } = this.state
    return (loading ?
      <ActivityIndicator size="large" color="#FF7500" />
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
