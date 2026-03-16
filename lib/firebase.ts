import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDg_Oyxyuy70gcet5KRnp4808WDfU3j9e0",
  authDomain: "ecocolis-9214f.firebaseapp.com",
  projectId: "ecocolis-9214f",
  storageBucket: "ecocolis-9214f.firebasestorage.app",
  messagingSenderId: "625729047006",
  appId: "1:625729047006:web:50208ab2203d435402b54f"
};

const app = initializeApp(firebaseConfig);

export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator 
  ? getMessaging(app) 
  : null;

export const requestForToken = async (registration?: ServiceWorkerRegistration) => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: 'BB7tQOsVf_zU_eAXn6eja6CRTtcwqJHJj6i8OtNJtyO-0NF7JHjqbpo64F1Ef-Yq_bmZnhhBf95yTGxNM7_qa2M',
      serviceWorkerRegistration: registration
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
