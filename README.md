# Introduction
SafeChat is a secure chat, using two methods for e2e encryption (Open-source third-party API Virgil Security and OpenSSL). SafeChat is developed using React Native for the front-end and Firebase (more specifically Firestore which is part of Firebase, but has a slightly different data model).

This project was created for the ECS153 (computer security) class at UC Davis/Spring 2019.

## App Demo (running on Android)

<img src="safeChat/assets/images/appdemo.gif" width="300">

## Installing/Running the App

#### Method 1 (run the server on the command line):

Create an expo account ([here]. Then, on the command line, run the following commands:

1. Install the Expo CLI with `npm install -g expo-cli`
2. Then type `expo login` and enter your credentials.
3. Clone our Github repository with `git clone <repo address>`.
3. Next, go to the `safeChat` directory and type `npm install` to install all the app's dependencies.
4. After the dependencies are installed, type `npm start`. This will run the server and the app is ready to use.
5. To open the app in a simulator, after the server begins type `i` on a mac to open the app on the Simulator or type `a` to open the app with Android Studio.
6. If you have the expo app on your phone, after running the server you can open Expo and you should see the app's name on the home screen. If you click on it, the app should open. 

#### Method 2: Get the published App (Easier):
1. Alternatively, if you have the Expo app on your phone, you can open the SafeChat on your phone by scanning the ([QR code](https://expo.io/@kauana/safeChat)) on Expo's website.
2. If you don't have the app installed, it can be easily found on the Apple Store for iPhone and Google Play for Android devices.

## Purpose
We wanted to create a chat that would allow users to securely chat from end to end. 

We also wanted to allow chatting and keep the user information necessary for using the app as little as possible. That is why we chose to only request an email and a username. The user email is only used to log in and it is handled by the authentication service on Firebase, i.e. we don't store it on the database, it is encrypted by Google. Next, the username is unique and stored on the database because it is used to identify the user on the app, but it can be anything and the user may choose to hide their identify with a random username such as *fluffyUnicorn123*.

Moreover, our goal was that only the user should ever see the messages that were sent to or from them.

## Structure
- The project stack is as follows: React Native (front-end), Firebase (back-end), Virgil Security SDK (encryption), Algolia API (full-text search).

- The app logic is as follows:
 - Login/SignUp logic is in `safeChat/screens/LoginScreen.js`. Basically, we communicate with Firebase and create accounts, database collections as needed.

- The bottom and top tab bars are in`safeChat/screens/TabNavigator.js`. In this file, we create the bottom and top tab bars which redirect users to search or home screens and allows the user to log out.

- From the bottom tab bars, users can choose two options: 1 - Home Screen and 2 - Search. The search logic is located at - Next, the chat features is in `safeChat/screens/SearchScreen.js`. On the search screen, we communicate with Algolia (react-instantsearch-native) which searches for the user given as input and return us information that allows us to query Firebase to display the information on the screen. Users can click on the results list to start a conversation with another user.

- The chat template is located in `safeChat/screens/ChatScreen.js` and used ([React Native Gifted Chat](https://github.com/FaridSafi/react-native-gifted-chat) to help us with the chat functionality. While users chat, we are constantly getting snapshots of the database and updating the app so users can see the messages as fast as possible. We also store messages timestamps to order them on the app. What is, more importantly, is that it is here that encryption takes place. When the user begins chatting, we lookup keys and when the user clicks on "send" we encrypt the messages and send them to Firebase for delivery. In addition, when users open the chat between then and the user users, we fetch all the messages and decrypt them to display them in the front end. 

- PS: the initial encryption set up logic is all located in `safeChat/ethree.js` and there we ask Virgil for a public key which is then stored on the device used `ExpoKeyEntryStorage`. 

- The home screen contains a list of active chats for the user. Clicking on any user open the chat template between the other and their friends. 

- Our cloud functions which are used for the full-text search are located in `safeChat/functions/index.js` and these functions are deployed using Google Cloud and run 24/7.

- Lastly, in `safeChat/App.js` we have the logic that glues everything together. There we create a stack of screens in the order we want, load necessary fonts, etc.

## Implementations
There are two implementations of our e2e encryption. One uses Virgil Security, a free tool for developers for key creation, signing, encryption/decryption, etc.
The other is an in-house implementation using OpenSSL.

### Virgil Security
There is a tag for the Virgil Security Implementation.
It was a very light workload. A callback function had to be set up for the front end and our back end, which just communicates with the Virgil Cloud as detailed in the presentation. They handle everything, other than account creation.

### OpenSSL
(Kush writes here)

### Authors
- Kauana dos Santos
- Chase Maguire
- Kush Patel
