// Firebase Configuration
// මෙහි ඔබේ Firebase project credentials තිබිය යුතුයි
// Firebase Console > Project Settings > General > Your apps > Config

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export services globally
window.firebaseAuth = auth;
window.firebaseDB = db;

console.log('✅ Firebase initialized successfully!');
