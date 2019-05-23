import React from 'react'
import { View, Platform } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat'
import KeyboardSpacer from 'react-native-keyboard-spacer';
import firebase from '../config';

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
    db.collection('users').doc(this.appUser).get()
      .then((userDoc) => {
        this.appUserName = userDoc.data().username
      })
    this.participantsString = [this.appUser, navigation.state.params.user.userID].sort().join(',')
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

    const message = messages[0]

    db.collection('messages').add({
      message: message.text,
      senderID: this.appUser,
      senderName: this.appUserName,
      participants: this.participantsString,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
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
