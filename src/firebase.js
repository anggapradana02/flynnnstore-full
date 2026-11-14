import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBbJSbVjRmyHFrEvDnADZoyINKO4t9QE9w",
  authDomain: "flynnnstore.firebaseapp.com",
  projectId: "flynnnstore",
  storageBucket: "flynnnstore.firebasestorage.app",
  messagingSenderId: "648721462486",
  appId: "1:648721462486:web:be4ceb17c21bac0bb1c577",
  measurementId: "G-SGZZFV3ZG2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();