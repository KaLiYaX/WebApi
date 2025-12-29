// FILE: src/config/firebase.js
// Firebase Configuration

const firebaseConfig = {
    apiKey: "AIzaSyBYGqBQmI4y3bPzRI5MOgBQUW5Wdu4rbFM",
    authDomain: "kaliyax-api.firebaseapp.com",
    projectId: "kaliyax-api",
    storageBucket: "kaliyax-api.firebasestorage.app",
    messagingSenderId: "500608402",
    appId: "1:500608402:web:08f3052795fffc2879e54b",
    measurementId: "G-3CM868DXM5"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export services globally
window.firebaseAuth = auth;
window.firebaseDB = db;

// Enable persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence enabled in first tab only');
        } else if (err.code === 'unimplemented') {
            console.warn('Browser does not support persistence');
        }
    });

console.log('Firebase initialized successfully');
