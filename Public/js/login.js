import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js"

// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
    apiKey: "AIzaSyBy4jU14CCvcTXBo6eTB104PVPAuDT5Aow",
    authDomain: "journalpublishing-harshad.firebaseapp.com",
    projectId: "journalpublishing-harshad",
    storageBucket: "journalpublishing-harshad.firebasestorage.app",
    messagingSenderId: "300945253831",
    appId: "1:300945253831:web:ed3ad229f0e4b41e2425e2",
    measurementId: "G-6EVL2F9CBJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);
const jdb = getDatabase(app);


function showMessage(info, divID) {
    var messageDiv = document.getElementById(divID);
    messageDiv.style.display = 'block';
    messageDiv.innerHTML = `
        <p>${info}</p>
        <button id="okay-btn">Okay</button>
    `;
    messageDiv.style.opacity = 1;

    document.getElementById('okay-btn').addEventListener('click', () => {
        messageDiv.style.opacity = 0;
    });

    setTimeout(function () {
        if (messageDiv.style.opacity != 0) {
            messageDiv.style.opacity = 0;
        }
    }, 5000);
}


// Signup button event listener
document.getElementById('signup-btn').addEventListener('click', () => {
    const username = document.getElementById('user-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Basic form validation
    if (username === '' || email === '' || password === '') {
        alert('Please fill out all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }


    // Create user with email and password
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User signed up:', user);
            const userData = {
                username: username,
                email: email
            };
            const docRef = doc(db, 'users', user.uid)
            setDoc(docRef, userData)
                .then(() => {
                    localStorage.setItem('accountCreated', 'true'); // Set flag in localStorage
                    localStorage.setItem('userEmail', user.email); // Store user email in local storage
                    localStorage.setItem('userName', username); // Store user name in local storage
                    window.location.href = 'index.html'; // Redirect to index page
                })
                .catch((error) => {
                    console.error('Error adding document: ', error);
                })
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error code:', errorCode);
            console.error('Error message:', errorMessage);
            alert('Error: ' + errorMessage);
        });
});
// log in user with email and password
document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (email === '' || password === '') {
        alert('Please fill out all fields');
        return;
    }
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('User logged in:', user);
            localStorage.setItem('userLoggedIn', 'true'); // Set flag in localStorage
            localStorage.setItem('userEmail', user.email); // Store user email in local storage

            // Fetch user data from Firestore
            const docRef = doc(db, 'users', user.uid);
            getDoc(docRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    localStorage.setItem('userName', userData.username); // Store user name in local storage
                    window.location.href = 'index.html'; // Redirect to index page
                } else {
                    console.log('No such document!');
                }
            }).catch((error) => {
                console.error('Error getting document:', error);
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error('Error code:', errorCode);
            console.error('Error message:', errorMessage);
            alert('Error: ' + errorMessage);
        });
});




document.getElementById("submit-form").addEventListener('click', function (e) {
    e.preventDefault();
    console.log("Form submission triggered"); // Add this line for debugging
    set(ref(jdb, 'User/' + localStorage.getItem('userName')), {
        username: localStorage.getItem('userName'),
        title: document.getElementById('title').value,
        abstract: document.getElementById('abstract').value,
        keywords: document.getElementById('keywords').value,
        researchArea: document.getElementById('research-area').value,
        country: document.getElementById('country').value,
        state: document.getElementById('state').value,
        city: document.getElementById('city').value,
        postalCode: document.getElementById('postal-code').value,
        address: document.getElementById('address').value,
        authorName: document.getElementById('authorName').value,
        authorDesignation: document.getElementById('authorDesignation').value,
        authorOrg: document.getElementById('authorOrg').value,
        authorEmail: document.getElementById('authorEmail').value,
        authorMobile: document.getElementById('authorMobile').value
    })
    .then(() => {
        alert('Data submitted successfully');
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error code:', errorCode);
        console.error('Error message:', errorMessage);
        alert('Error: ' + errorMessage);
    });
});