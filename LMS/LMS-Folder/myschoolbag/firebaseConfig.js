// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjaXXKFhN7okG3G5KcxFya2S_-BEUp3IU",
  authDomain: "group16psd-6aff9.firebaseapp.com",
  projectId: "group16psd-6aff9",
  storageBucket: "group16psd-6aff9.firebasestorage.app",
  messagingSenderId: "693748932869",
  appId: "1:693748932869:web:1910389bd278bbc4c2976c",
  measurementId: "G-Q2R938RK1C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export { app };
export { storage };
export const auth = getAuth(app);
export const db = getFirestore(app);