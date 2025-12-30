// FILE: src/config/firebase.js
// Firebase Configuration + EmailJS

const firebaseConfig = {
    apiKey: "AIzaSyCdYlIF1-Zx1TpuiQnnScykdrlEqJYj2MA",
    authDomain: "kaliyax.firebaseapp.com",
    projectId: "kaliyax",
    storageBucket: "kaliyax.firebasestorage.app",
    messagingSenderId: "46921532670",
    appId: "1:46921532670:web:af7ff28d4b7152b6f0d1af",
    measurementId: "G-ENGL9B80X2"
};

// ⚠️ IMPORTANT: EmailJS Configuration
// 1. https://www.emailjs.com/ වලට යන්න (FREE)
// 2. Gmail service එක connect කරන්න
// 3. Email template එකක් හදාගන්න
// 4. මේ values replace කරන්න:

const emailJSConfig = {
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',      // e.g., 'user_abc123def456'
    serviceId: 'service_x9w7str',               // e.g., 'service_gmail123'
    templateId: 'YOUR_TEMPLATE_ID'              // e.g., 'template_xyz789'
};

// TEMPLATE EXAMPLE for EmailJS:
// Subject: KaliyaX API - Email Verification
// Body:
// Hello,
// Your verification code is: {{code}}
// This code expires in {{expires_in}}.
// Best regards, KaliyaX Team

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
window.emailJSConfig = emailJSConfig;

// Enable persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence enabled in first tab only');
        } else if (err.code === 'unimplemented') {
            console.warn('Browser does not support persistence');
        }
    });

console.log('✅ Firebase initialized');
console.log('✅ EmailJS configured');
