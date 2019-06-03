import firebase from 'firebase';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import { EThree } from '@virgilsecurity/e3kit';
import createExpoKeyEntryStorage from '@virgilsecurity/key-storage-rn/expo';
const CLOUD_FUNCTION_ENDPOINT = 'https://us-central1-ecs153-chat.cloudfunctions.net/api/virgil-jwt'

const keyEntryStorage = createExpoKeyEntryStorage();

// Initialization callback that returns a Virgil JWT string from the E3kit firebase function
async function fetchToken(authToken) {
    const response = await fetch(
        CLOUD_FUNCTION_ENDPOINT,
        {
            headers: new Headers({
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            })
        },
    );
    if (!response.ok) {
        throw `Error code: ${response.status} \nMessage: ${response.statusText}`;
    }
    return response.json().then(data => data.token);
};

let eThreePromise = () => new Promise((resolve, reject) => {
    const user = firebase.auth().currentUser;
    const getToken = () => user.getIdToken().then(fetchToken);
    eThreePromise = EThree.initialize(getToken, { keyEntryStorage })
    eThreePromise.then(resolve).catch(reject);
});

export default eThreePromise;

