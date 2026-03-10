import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// LOGIN
window.login = function(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
  .then(()=>{
    window.location = "dashboard.html";
  })
  .catch(e => alert(e.message));

}

// SIGNUP
window.signup = function(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
  .then(()=>{
    window.location = "dashboard.html";
  })
  .catch(e => alert(e.message));

}
