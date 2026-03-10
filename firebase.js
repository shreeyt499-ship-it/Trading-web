// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyAQkrYNZ4uR_FIFV0zE7ioEetu7xb5bGlc",
  authDomain: "trading-journal-1ea0f.firebaseapp.com",
  projectId: "trading-journal-1ea0f",
  storageBucket: "trading-journal-1ea0f.firebasestorage.app",
  messagingSenderId: "519108528223",
  appId: "1:519108528223:web:259b83ec90548a2848b3ea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
