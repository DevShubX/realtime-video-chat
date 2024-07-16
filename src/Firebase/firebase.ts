// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUZXSmeYKuduFNHjHruCNrlSyaLZD_m0o",
  authDomain: "webrtc-app-b70e4.firebaseapp.com",
  projectId: "webrtc-app-b70e4",
  storageBucket: "webrtc-app-b70e4.appspot.com",
  messagingSenderId: "75008862267",
  appId: "1:75008862267:web:43d873b6407edd7400d41e",
  measurementId: "G-3NRRTFPSK0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const firestore = getFirestore();
