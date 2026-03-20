import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAY1ZvZui3AB8OSZJZEZiuCN1kD1MgJ4nw",
  authDomain: "gen-lang-client-0598160257.firebaseapp.com",
  projectId: "gen-lang-client-0598160257",
  storageBucket: "gen-lang-client-0598160257.firebasestorage.app",
  messagingSenderId: "576377257032",
  appId: "1:576377257032:web:9a2d4b9d87aa8d3f26ec7d",
  measurementId: "G-P2H82ES2QL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
