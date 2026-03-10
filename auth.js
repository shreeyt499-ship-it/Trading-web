function login(){

const email=document.getElementById("email").value
const password=document.getElementById("password").value

auth.signInWithEmailAndPassword(email,password)

.then(()=>{

window.location="dashboard.html"

})

.catch(e=>alert(e.message))

}

function signup(){

const email=document.getElementById("email").value
const password=document.getElementById("password").value

auth.createUserWithEmailAndPassword(email,password)

.then(()=>{

window.location="dashboard.html"

})

.catch(e=>alert(e.message))

}
