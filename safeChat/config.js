import * as firebase from 'firebase';
import firestore from 'firebase/firestore';

let config = {
  apiKey: 'AIzaSyBVqeb66yqJnUr1MYN6Q2mR3wdZulFSYKI',
  authDomain: 'ecs153-chat.firebaseapp.com',
  databaseURL: 'https://ecs153-chat.firebaseio.com',
  projectId: 'ecs153-chat',
  storageBucket: 'ecs153-chat.appspot.com',
  messagingSenderId: '153557078995',
  appId: "1:153557078995:web:736613fb4d605307"
};

firebase.initializeApp(config);

export default firebase;
