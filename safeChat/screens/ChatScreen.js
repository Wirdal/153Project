import React from 'react'
import { View, Platform } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat'
import KeyboardSpacer from 'react-native-keyboard-spacer';
import firebase from '../config';
import {Crypt, keyManager, RSA} from 'hybrid-crypto-js';

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

    this.state = {
      messages: [],
    }

    this.appUser = firebase.auth().currentUser.uid
    this.appUserName = ''
    this.peerUserName = ''
    this.appPrivateKey = ''
    this.peerPublicKey = ''
    db.collection('users').doc(this.appUser).get()
      .then((userDoc) => {
        this.appUserName = userDoc.data().username

        // Obtaining senders privateKey for this user ...
        // to decrypt encrypted messages they receive.
        this.appPrivateKey = userDoc.data().privateKey

      })
    this.peerID = navigation.state.params.user.userID
    db.collection('users').doc(this.peerID).get()
      .then((userDoc) => {
        this.peerUserName = userDoc.data().username

        // Obtaining receivers public key for that user ...
        // to decrypt encrypted message that current user is sending.
        this.peerPublicKey = userDoc.data().publicKey
      })
    this.participantsString = [this.appUser, this.peerID].sort().join(',')
    this.messagesRef = db.collection('messages')
      .where('participants', '==', this.participantsString)
    this.unsubscribe = null
  }

  componentWillMount() {
    this.unsubscribe = this.messagesRef.onSnapshot(this.onMessagesUpdate.bind(this));
  }

  onSend(messages = []) {
    if (messages.length === 0) {
      return
    }

    //------ Encryption
    var crypt = new Crypt();

    console.log(messages);

    const plain_message = messages[0];

    console.log(plain_message['text']);

    const message = crypt.encrypt(this.peerPublicKey, plain_message['text']);

    console.log(message);
    //------ Encryption

    db.collection('messages').add({
      message: message.text,
      senderID: this.appUser,
      senderName: this.appUserName,
      participants: this.participantsString,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const leftRef = db.collection('chats').doc(this.appUser)
    const leftChat = {
      id: this.peerID,
      username: this.peerUserName,
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

    const rightRef = db.collection('chats').doc(this.peerID)
    const rightChat = {
      id: this.appUser,
      username: this.appUserName,
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

  onMessagesUpdate(querySnapshot) {
    const messages = [];

    querySnapshot.forEach((doc) => {
      let {
        senderID, senderName, message, timestamp
      } = doc.data();

      if (!timestamp) {
        timestamp = Date.now()
      } else {
        timestamp = timestamp.toDate()
      }

      messages.push({
        _id: doc.id,
        text: message,
        createdAt: timestamp,
        user: {
          _id: senderID,
          name: senderName
        }
      });
    });

    const sortedMessages = messages.sort((a, b) => (b.createdAt - a.createdAt));

    this.setState({ messages: sortedMessages });
  }

  render() {
    return (
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
