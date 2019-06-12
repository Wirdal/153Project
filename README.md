# Introduction
SafeChat is a secure chat, using two methods for e2e encryption.
## Installation
Create an expo account, so that expo login can function.
Run the following commands.

1. npm install -g expo-cli
2. expo login
3. go to safe chat directory and npm install
4. npm start
In addition, download and Expo app on your mobile device

## Purpose
We wanted to create a chat that would allow users to securley chat from end to end. Our goal was that only the user's should ever see the messages that were sent to or from them.

## Structure
The project uses react-native to run on mobile devices. 

## Implementations
There are two implementations of our e2e encryption. One uses Virgil Security, a free tool for developers for key creation, signing, encryption/decryption etc.
The other is an in-house implementation using OpenSSL.

### Authors
- Kauana dos Santos
- Chase Maguire
- Kush Patel
