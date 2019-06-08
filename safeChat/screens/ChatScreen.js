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
    // The chats between the two users. Info is known because of the peer is added to the state?
    this.messagesRef = db.collection('messages').where('participants', '==', this.participantsString)
    this.unsubscribe = null
  }

  //This is done after selecting a user to message
  async componentWillMount() {
    const { appUser, peerID } = this;

    // Get the documents from the database, based on ID
    const appUserDoc = await db.collection('users').doc(appUser).get()
    const peerDoc = await db.collection('users').doc(peerID).get()

    // Construct the Virgil callback
    this.eThree = await eThreePromise();
    const usersToEncryptTo = [...new Set([appUser, peerID])];
    let publicKeys
    try {
      // Get the public keys
      publicKeys = await this.eThree.lookupPublicKeys(usersToEncryptTo);
    } catch(err) {
      // Throw an error if Virgil fails
      console.error(err.lookupResult)
    }

    this.setState({
      //Set the username for both the sender and reciever in the state
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
      read: false, // Sent the message. Currently unread, so, keep it alive. Remove it whem recieved? Or just dont tell the user we have it
    });

    const appUserObj = { id: appUser, username: appUserName }
    const peerUserObj = { id: peerID, username: peerUserName }
    // Create the chat. Will concat onto existing ones otherwise
    this.createChat(appUserObj, peerUserObj)
    this.createChat(peerUserObj, appUserObj)
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  async onMessagesUpdate(querySnapshot) {
    // The messages we will recieve
    const encryptedMessages = [];
    querySnapshot.docChanges().forEach(function(change) {
      if (change.type === "added") {
        let {
          senderID, senderName, message, timestamp, read,
        } = change.doc.data();

        if (!timestamp) {
          timestamp = Date.now()
        } else {
          timestamp = timestamp.toDate()
        }

        encryptedMessages.push({
          read: read,
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
        if (!encryptedMessage.read){
          messages.push(message);
        }
        else { // Tell the database that the message is read.
          db.collection("messages").doc(encryptedMessage._id).update({
            read: true
          })
        }
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
