// FILE: src/AuthPage.jsx - OAuth Only Authentication (No Email/Password)

const { useState, useEffect } = React;

function AuthPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [referralCode, setReferralCode] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        if (ref) {
            setReferralCode(ref);
        }
    }, []);

    const generateProfilePicture = (userName) => {
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="${color}"/>
                <text x="50%" y="50%" font-size="80" font-family="Arial" font-weight="bold" 
                      fill="white" text-anchor="middle" dy=".35em">${initials}</text>
            </svg>
        `)}`;
    };

    const handleOAuthLogin = async (provider) => {
        setError('');
        setLoading(true);

        try {
            let authProvider;
            if (provider === 'google') {
                authProvider = new firebase.auth.GoogleAuthProvider();
            } else if (provider === 'github') {
                authProvider = new firebase.auth.GithubAuthProvider();
            } else if (provider === 'facebook') {
                authProvider = new firebase.auth.FacebookAuthProvider();
            }

            const result = await window.firebaseAuth.signInWithPopup(authProvider);
            const user = result.user;

            const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                // New user - create account with bonuses
                let welcomeBonus = 100;
                let referralBonusAmount = 60;

                try {
                    const settingsDoc = await window.firebaseDB.collection('settings').doc('system').get();
                    if (settingsDoc.exists) {
                        const settings = settingsDoc.data();
                        welcomeBonus = settings.welcomeBonus || 100;
                        referralBonusAmount = settings.referralBonus || 60;
                    }
                } catch (settingsError) {
                    console.warn('Using default bonus settings');
                }

                const apiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);

                const userName = user.displayName || user.email.split('@')[0];
                const profilePicture = user.photoURL || generateProfilePicture(userName);
                const userReferralCode = user.uid.substring(0, 8).toUpperCase();

                let totalBonus = welcomeBonus;
                let referrerId = null;

                // Process referral code
                if (referralCode && referralCode.trim() !== '') {
                    try {
                        const referrerQuery = await window.firebaseDB.collection('users')
                            .where('referralCode', '==', referralCode.trim())
                            .limit(1)
                            .get();

                        if (!referrerQuery.empty) {
                            const referrerDoc = referrerQuery.docs[0];
                            referrerId = referrerDoc.id;
                            
                            totalBonus += referralBonusAmount;

                            // Give bonus to referrer
                            await window.firebaseDB.collection('users').doc(referrerId).update({
                                balance: firebase.firestore.FieldValue.increment(referralBonusAmount)
                            });

                            // Add transaction for referrer
                            await window.firebaseDB.collection('users').doc(referrerId).collection('transactions').add({
                                type: 'referral',
                                amount: referralBonusAmount,
                                from: user.email,
                                description: `Referral bonus from ${user.email}`,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });

                            // Notify referrer
                            await window.firebaseDB.collection('users').doc(referrerId).collection('notifications').add({
                                type: 'announcement',
                                title: '🎉 Referral Bonus Earned!',
                                message: `You earned ${referralBonusAmount} coins for referring ${user.email}!`,
                                amount: 0,
                                claimed: true,
                                read: false,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    } catch (refError) {
                        console.error('Referral processing error:', refError);
                    }
                }

                // Create new user
                await window.firebaseDB.collection('users').doc(user.uid).set({
                    name: userName,
                    email: user.email,
                    apiKey: apiKey,
                    balance: totalBonus,
                    profilePicture: profilePicture,
                    bio: '',
                    referralCode: userReferralCode,
                    referredBy: referrerId,
                    apiKeyPaused: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    totalCalls: 0,
                    status: 'active',
                    emailVerified: true,
                    oauthProvider: provider
                });

                // Add signup transaction
                await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                    type: 'signup_bonus',
                    amount: totalBonus,
                    description: referrerId 
                        ? `Welcome bonus (${welcomeBonus}) + Referral bonus (${referralBonusAmount})` 
                        : `Welcome bonus (${welcomeBonus})`,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Welcome notification
                await window.firebaseDB.collection('users').doc(user.uid).collection('notifications').add({
                    type: 'announcement',
                    title: '🎉 Welcome to KaliyaX API!',
                    message: `Account created! You received ${totalBonus} coins${referrerId ? ' (including referral bonus!)' : ''}`,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                console.log(`✅ New user created: ${user.email} with ${totalBonus} coins`);
            } else {
                // Existing user - check if suspended
                if (userDoc.data().status === 'suspended') {
                    await window.firebaseAuth.signOut();
                    setError('Your account has been suspended. Contact support.');
                    setLoading(false);
                    return;
                }
                console.log(`✅ User logged in: ${user.email}`);
            }
        } catch (err) {
            console.error('OAuth error:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled');
            } else if (err.code === 'auth/account-exists-with-different-credential') {
                setError('Account already exists with this email using a different login method');
            } else if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked. Please allow popups for this site.');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaDJWNjBoLTJ6TTAgMzZoMzB2Mkgwdi0yem0zMCAwaDMwdjJIMzB2LTJ6Ij48L3BhdGg+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
            
            <nav className="relative z-10 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center font-bold text-xl">K</div>
                            <span className="text-xl font-bold">KaliyaX API</span>
                        </div>
                        <a href="admin.html" className="text-slate-400 hover:text-white text-sm transition-colors">
                            Admin Login
                        </a>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl animate-fade-in">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-3xl">
                                K
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Welcome to KaliyaX</h2>
                            <p className="text-slate-400">
                                Sign in to access powerful API services
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center space-x-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {referralCode && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-green-400 font-semibold">🎉 Referral Code Applied!</p>
                                        <p className="text-green-300 text-sm">You'll get 60 extra coins on signup</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button 
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                className="w-full py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 border border-gray-300 shadow-sm"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#EA4335" d="M5.27 9.76A7.5 7.5 0 0 1 19.5 12h-7.02v3h4.52a3.99 3.99 0 0 1-6 2.24v2.76h2.76A7.48 7.48 0 0 0 19.5 12c0-.58-.05-1.14-.14-1.68H12.48v3.44z"/>
                                            <path fill="#4285F4" d="M12 20a7.48 7.48 0 0 0 5.26-1.93l-2.56-1.99A4.73 4.73 0 0 1 7.5 12H4.53v2.58A7.5 7.5 0 0 0 12 20z"/>
                                            <path fill="#FBBC05" d="M7.5 12a4.5 4.5 0 0 1 0-2.92V6.5H4.53a7.5 7.5 0 0 0 0 7.08z"/>
                                            <path fill="#34A853" d="M12 7.5c1.16 0 2.19.4 3.01 1.18l2.26-2.26A7.5 7.5 0 0 0 4.53 9.08L7.5 11.5A4.48 4.48 0 0 1 12 7.5z"/>
                                        </svg>
                                        <span>Continue with Google</span>
                                    </>
                                )}
                            </button>

                            <button 
                                onClick={() => handleOAuthLogin('facebook')}
                                disabled={loading}
                                className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-sm"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        <span>Continue with Facebook</span>
                                    </>
                                )}
                            </button>

                            <button 
                                onClick={() => handleOAuthLogin('github')}
                                disabled={loading}
                                className="w-full py-3 bg-[#24292e] hover:bg-[#1b1f23] text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-sm"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        <span>Continue with GitHub</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 text-center text-slate-400 text-sm">
                            <p>By continuing, you agree to our</p>
                            <div className="flex items-center justify-center space-x-2 mt-1">
                                <a href="#" className="text-purple-400 hover:text-purple-300">Terms</a>
                                <span>•</span>
                                <a href="#" className="text-purple-400 hover:text-purple-300">Privacy</a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-blue-400 text-sm">
                                ✨ Sign up now and get <span className="font-bold">100 coins</span> bonus!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
