# Sprint Meeting 2 (5/24/2019)

##### See our progress in our [Trello](https://trello.com/b/A29h9i9f/ecs153)
board.

## What we did:

- **Kauana**

 Added Algolia to the app for full-text search. Users can now have a unique
 username to identify them and we add this username to Algolia with a cloud
 function that runs when an account is created or deleted. Then, users can go to
 the search screen and do an instant search for usernames
 ([commit](https://github.com/Wirdal/153Project/commit/3439902986c61d998ab1f578556ef131ec912e2f)).

 Added an avatar generator similar to what Gmail uses. When an account is
 created we generate a random avatar based on the first two letters of the
 username (so avatar has first username's first letters + color based on these
 first 2 letters). Added this so give the app some color to the app and make the
 search/chat screens more pleasant to look at
 ([commit](https://github.com/Wirdal/153Project/commit/b11447d83aad5382ef08ac444a3b27c4f2ab8e9f)).

 Changed search screen to a list so users can click on the username row to
 initiate a conversation with another user. If users change their mind, the app
 sends them back to the search screen
 ([commit](https://github.com/Wirdal/153Project/commit/b11447d83aad5382ef08ac444a3b27c4f2ab8e9f)).

 Added a chat screen template using the
 [react-native-gifted-chat](https://github.com/FaridSafi/react-native-gifted-chat)
 UI library and customized it to fit app needs ([commit]
 (https://github.com/Wirdal/153Project/commit/51e7612e41045d7157355d0de9a541651070a273)).

 Created the Firestore data model to store messages and active chats. We now
 have 2 more collections:
 - **1. messages**: each document stores a single message, ``senderId,
   senderNamename, timestamp`` (these three stored so we can search and display
   data later in the front end) and ``participants`` (a ``string`` with both
   ``senderID,receiverID``) which is used to show conversations on contacts
   screen).

 - **2. active**: each document stores the users that the current user is
   currently chatting with. This is also used to display data in the
   `ContactsList` and makes it easier to delete chats in case we do this in the
   future. PS: THE MESSAGES ARE NOT ENCRYPTED YET ([commit]
   (https://github.com/Wirdal/153Project/commit/1e61f6390d3fc3dd11464428acd4b72ebdc0d51c)).


- **Chase**

- **Kush**


## What we plan to do (all depends on the meeting with the professor):

- **Kauana**

 Add settings screen with log out option, possibly notifications when users
 receive a message, a bug reporting screen and maybe we can let the users decide
 if they want messages deleted every day or every 100 messages, etc.

 Add encryption to the chat using Virgil Security and ensure messages are fully
 encrypted in Firebase.

 Begin working on the README necessary for the final project. I am planning to
 talk about logic for all screens, how the backend/frontend is structured.

 Try to improve app performance or find what is causing a loading issue.


- **Chase**


- **Kush**

## Issues we had this week:

- **Kauana**

 Performance. For some reason, the app is a bit slower than it should be
 considering we don't have much data. Apparently, there seem to be some issues
 with Firebase and I am hoping to try out some of the solutions I found next
 week.

 Since we started with the chat not being encrypted, it was hard to develop an
 accurate data model. We may need to rewrite the data model depending on how
 Virgil interacts with Firebase.


- **Chase**


- **Kush**


