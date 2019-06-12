import React from 'react'
import { View, Platform } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat'
import KeyboardSpacer from 'react-native-keyboard-spacer';
import firebase from '../config';
import {Crypt, keyManager, RSA} from 'hybrid-crypto-js';
import RNFS from 'react-native-fs';


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
      loading : true,
      appUsername : '',
      peerUsername: '',
      appPrivateKeyRow: '',
    }

    this.appUser = appUser
    this.peerID = peerID
    this.participantsString = [appUser, peerID].sort().join(',')
    // The chats between the two users. Info is known because of the peer is added to the state?
    this.messagesRef = db.collection('messages2').where('participants', '==', this.participantsString)
    this.unsubscribe = null

    db.collection('users').doc(this.appUser).get()
      .then((userDoc) => {
        this.appUserName = userDoc.data().username

        // Obtaining senders privateKey for this user ...
        // to decrypt encrypted messages they receive.
        this.appPrivateKeyRow = userDoc.data().row

      })
    //this.peerID = navigation.state.params.user.userID
    db.collection('users').doc(this.peerID).get()
      .then((userDoc) => {
        this.peerUserName = userDoc.data().username

        // Obtaining receivers public key for that user ...
        // to decrypt encrypted message that current user is sending.
        this.peerPublicKey = userDoc.data().publicKey
      });
  }

  componentWillMount() {
    this.unsubscribe = this.messagesRef.onSnapshot(this.onMessagesUpdate.bind(this));
  }

  // From e2e virgil branch
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

  inverseBWT(string, row){
    if (string.length == 0 || string == null)
    {
      return null;
    }

    //Code from https://github.com/railsstudent/codewars/blob/master/js/burrows-wheeler-transformation/burrows-wheeler.js
    let invertList = string.split('').sort();
    console.log(invertList);
    for (let i = 0; i < string.length - 1; i++) {
      invertList = invertList.map((e, i) => {
          return `${string[i]}${e}`;
        }).sort();
    }

    return invertList[row];
  }

  onSend(messages = []) {
    if (messages.length === 0) {
      return
    }

    // Create encryption on message that needs to be sent
    const { appUser, peerID, participantsString } = this;
    const { appUserName, peerUserName } = this.state;

    // Obtaining actual text message and crpytion variable
    const message = messages[0];
    var crypt = new Crypt();

    var plain_message = messages[0];

    // Calling encryption function on plain text and encrypting with public key of receiver
    const message = crypt.encrypt(this.peerPublicKey, plain_message['text']);

    //------ Encryption
    // Sending Encrypted message to database
    //'message' is really an object of sorts that contains package version, initalization vector,
    // encrypted AES keys by RSA and actual encrypted Text
    db.collection('messages2').add({
      message: message,
      senderID: this.appUser,
      senderName: this.appUserName,
      participants: this.participantsString,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // From e2e virgil branch
    const appUserObj = { id: appUser, username: appUserName }
    const peerUserObj = { id: peerID, username: peerUserName }
    // Create the chat. Will concat onto existing ones otherwise
    this.createChat(appUserObj, peerUserObj)
    this.createChat(peerUserObj, appUserObj)
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // From e2e branch
  onMessagesUpdate(querySnapshot) {
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
    });

    const messages = [...this.state.messages]
    const publicKey = this.state.peerPublicKey;

    var crypt = new Crypt();
    // Writing private key to file
    // In Relation to UserID

    // this.appUser is the uid set by firebase
    const userID = this.appUser;
    const fileName = userID + ".txt";

    // paths are case sensetive
    const transformed_PrivateKey;

    // Obtaining proper path to read file
    const path = RNFS.DocumentDirectoryPath + '/' + fileName;
    // Reading Private key using the userid, which is the name of the file we wrote to
    RNFS.readFile(path, 'utf8')
      .then((contents) => {

        transformed_PrivateKey = contents;
        console.log('File Read Succesfuuly');

        // Using the contents read from file, which are the transformed private key
        // calling inverse burrows wheeler transformation to obtain original key
        const privateKey = inverseBWT(transformed_PrivateKey, this.appPrivateKeyRow);

        // Decrypting messages based on logic from E2E branch
        for (const encryptedMessage of encryptedMessages) {
          try {
            const t = Date.now()

            const decryptedText = crypt.decrypt(privateKey, encryptedMessage);
            const message = { ...encryptedMessage, text: decryptedText }

            if (!encryptedMessage.read){
              messages.push(message);
            }
            else { // Tell the database that the message is read.
              db.collection("messages2").doc(encryptedMessage._id).update({
                read: true
              })
            }
          } catch (e) {
            console.log(`Could not decrypt message from`)
          }
        }

        const sortedMessages = messages.sort((a, b) => (b.createdAt - a.createdAt));

        this.setState({
          messages: sortedMessages,
          loading: false,
        });
      }).catch((err) => {
        console.log('Error in reading file');
      });

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
