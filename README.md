# KaliyaX API Portal 🚀

Professional API Developer Dashboard with Firebase Authentication and Firestore Database.

## Features ✨

- 🔐 **Firebase Authentication** - Secure user registration and login
- 💾 **Firestore Database** - Real-time data storage
- 🎨 **Modern UI** - Beautiful gradient design with glassmorphism
- 💰 **Coin System** - Virtual currency for API calls
- 🔑 **API Key Management** - Generate and regenerate API keys
- 💸 **Coin Packages** - Purchase coins with LKR pricing
- 📊 **Transaction History** - Complete transaction logs
- 🤝 **Coin Transfer** - Send coins to other users
- 📚 **API Library** - 20+ API endpoints with documentation
- 🔍 **Search & Filter** - Find APIs easily
- 📱 **Fully Responsive** - Works on all devices

## File Structure 📁

```
kaliyax-api-portal/
│
├── index.html                    # Main HTML file
├── styles.css                    # Custom CSS styles
├── package.json                  # Dependencies
├── README.md                     # This file
├── SETUP_GUIDE.md               # Detailed setup guide (Sinhala)
├── .gitignore                   # Git ignore rules
├── .env.example                 # Environment variables template
├── firebase.json                # Firebase hosting config
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Database indexes
│
└── src/
    ├── config/
    │   └── firebase.js          # Firebase configuration
    │
    ├── utils/
    │   ├── api.js               # Helper functions
    │   └── constants.js         # Application constants
    │
    ├── App.jsx                  # Main application component
    ├── AuthPage.jsx             # Login & Signup
    ├── Dashboard.jsx            # Main dashboard
    ├── OverviewTab.jsx          # Overview tab component
    ├── ApiLibraryTab.jsx        # API library tab
    ├── TransactionsTab.jsx      # Transaction history
    └── Footer.jsx               # Footer component
```

## Quick Start 🎯

### 1. Clone/Download Project
```bash
git clone https://github.com/yourusername/kaliyax-api-portal.git
cd kaliyax-api-portal
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Copy your Firebase config

### 3. Configure Firebase
Edit `src/config/firebase.js` and add your Firebase credentials:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Run Local Server
```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx http-server -p 3000

# Using PHP
php -S localhost:3000
```

### 5. Access Application
Open browser and go to: `http://localhost:3000`

## Database Structure 🗄️

### Users Collection
```javascript
users/{userId} = {
    name: string,
    email: string,
    apiKey: string,
    balance: number,
    totalCalls: number,
    status: string,
    createdAt: timestamp
}
```

### Transactions Subcollection
```javascript
users/{userId}/transactions/{transactionId} = {
    type: string,
    amount: number,
    description: string,
    timestamp: timestamp,
    price: string (optional),
    to: string (optional),
    from: string (optional)
}
```

## Usage Guide 📖

### Creating Account
1. Click "Create Account"
2. Enter email and password
3. Get 160 coins bonus (100 base + 60 referral)

### Using API
```javascript
fetch('https://api.kaliyax.com/v1/endpoint', {
    headers: {
        'x-api-key': 'YOUR_API_KEY'
    }
})
```

### Buying Coins
1. Go to Overview tab
2. Choose a package
3. Click "Buy Now"

### Transferring Coins
1. Go to Overview tab
2. Click "Transfer Coins"
3. Enter recipient email and amount
4. Click "Send"

## API Endpoints 🔌

- **AI & ML**: GPT Chat, Image Gen, TTS, STT, Sentiment
- **Data**: Weather, Currency, Stocks, News, Crypto
- **Utils**: QR Gen, URL Shortener, Email Validator, PDF Gen, Image Resize
- **Social**: Instagram, Twitter, YouTube, TikTok, Facebook

**Cost**: 5 coins per request

## Technologies Used 💻

- React 18
- Firebase Authentication
- Firestore Database
- Tailwind CSS
- HTML5/CSS3
- JavaScript ES6+

## Security 🔒

- Firebase Authentication for secure login
- Firestore security rules
- API key encryption
- HTTPS only
- Rate limiting

## Support 💬

- Email: support@kaliyax.com
- Website: https://kaliyax.com
- Documentation: https://docs.kaliyax.com

## License 📄

MIT License - Free to use and modify

## Contributors 👥

- KaliyaX Team

---

Made with ❤️ by KaliyaX Team
