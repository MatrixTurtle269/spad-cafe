import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyB3QH28PM8Er_l76wJlg1VuUARqL8UNDRI",
  authDomain: "spad-cafe.firebaseapp.com",
  projectId: "spad-cafe",
  storageBucket: "spad-cafe.firebasestorage.app",
  messagingSenderId: "409637636001",
  appId: "1:409637636001:web:dec978c8babe24a27aede0",
  measurementId: "G-1K633SD4PW",
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
