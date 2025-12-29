// FILE: src/config/firebase.js
// Firebase Configuration

const firebaseConfig = {
    apiKey: "AIzaSyCdYlIF1-Zx1TpuiQnnScykdrlEqJYj2MA",
    authDomain: "kaliyax.firebaseapp.com",
    projectId: "kaliyax",
    storageBucket: "kaliyax.firebasestorage.app",
    messagingSenderId: "46921532670",
    appId: "1:46921532670:web:af7ff28d4b7152b6f0d1af",
    measurementId: "G-ENGL9B80X2"
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
