import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAQkrYNZ4uR_FIFV0zE7ioEetu7xb5bGlc" ,
  authDomain: "trading-journal-1ea0f.firebaseapp.com",
  projectId: "trading-journal-1ea0f",
  storageBucket: "trading-journal-1ea0f.firebasestorage.app",
  messagingSenderId: "519108528223",
  appId: "1:519108528223:web:259b83ec90548a2848b3ea"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
