# Sprint Meeting 1 (5/17/2019)

##### See our progress in our [Trello](https://trello.com/b/A29h9i9f/ecs153) board.

## What we did:

- **Kauana**

 Worked on the login and sign up screen using React Native ([commit](https://github.com/Wirdal/153Project/commit/f685b375b3c9f04a3c3738242b13e8898af7ee2a)).

 Set up Firebase so users can create an account and login once they have an account. We are currently storing only user's username (unique) so users can find one another ([commit1](https://github.com/Wirdal/153Project/commit/54eefaa8cb7f3a4f50dfdd7dbe50ed322d06bbd7)) and [commit2](https://github.com/Wirdal/153Project/commit/0f0b84f81d479ce6a849082f0a1e222de9c6be23)).

 Add screens flow by adding a bottom tab navigations with two tabs: home (which will be a list of chats opened) and search (which will allow users to search for each other and start a conversation ([commit](https://github.com/Wirdal/153Project/commit/ccdef4442345ab07349a98c03e8f3682560010c5)).


- **Chase**
 
 Create a refined and detailed version of our threat model, as well as the objectives of our application.
 
 Created a pretty picture with a high-level view of the application.
- **Kush**

## What we plan to do (all depends on the meeting with the professor):
- **Kauana**
 
 Work on the front-end for the chat screen, search screen, and contacts screen (home).
 
 Allow users to search for other users by username using Algolia.

 Add a settings screen so the user can choose privacy settings etc that will best fit his/her preference (such as   notifications? how often to delete messages maybe? etc).


- **Chase**

 Help get Firebase and our application to pass messages. Look into alternatives for Virgil, if needed, based on the meeting.

- **Kush**

Create a simple nodejs website to sync with the app.

Simulate automated attacks on the app using appium or otherwise tools. For the website too using casper and selenium.

Add defenses to make sure messages are not automated and users cannot spam.

## Issues we had this week:

- **Kauana**

 I was not really sure how to allow users to search for other users in the chat because apparently, Firebase doesn't give us that option but I find out about a 3rd party application that does index searching and should fix our problem.

 Since we are trying to think about user safety and privacy and had a hard time figuring out how to allow account creation while also keeping user privacy because we don't want emails to be public, but we should allow users to search for user users and accounts should be created because if it is all anonymous I believe we are more prone to attacks. We decided to add a username field, which is unique and identifies a user. Since it can be anything, we believe it is a safe choice than allowing users to search for each other by name, email, etc.

 Login security is also an issue. We are still researching how to make our login secure and how to prevent attacks such as code injection and so on. We will also research how Firebase protects users against these things.

- **Chase**

 Finding out **how** secure Virgil is. I am still not convinced that the easy solution is the best solution. I would have to hear from the meeting tomorrow.

- **Kush**

 How exactly to make the app draw variables such as typespeed and etc to obtain whether actions are by user or an automation script?
