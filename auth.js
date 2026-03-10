import { auth, googleProvider } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } 
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Existing email/password login
window.login = async function(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location = "dashboard.html";
    } catch(e){
        alert(e.message);
    }
}

window.signup = async function(){
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location = "dashboard.html";
    } catch(e){
        alert(e.message);
    }
}

// NEW: Google login
window.loginWithGoogle = async function() {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location = "dashboard.html";
    } catch(e) {
        alert(e.message);
    }
}
