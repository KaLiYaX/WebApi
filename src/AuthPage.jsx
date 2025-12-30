// FILE: src/AuthPage.jsx - COMPLETE WITH EMAILJS

const { useState, useEffect } = React;

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        if (ref) {
            setReferralCode(ref);
            setIsLogin(false);
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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                if (userDoc.data().status === 'suspended') {
                    await window.firebaseAuth.signOut();
                    setError('Your account has been suspended. Contact support.');
                    setLoading(false);
                    return;
                }
                
                if (!userDoc.data().emailVerified) {
                    setError('Please verify your email first');
                    await window.firebaseAuth.signOut();
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            // Send verification email using EmailJS
            const result = await window.emailService.sendVerificationEmail(email, 'signup');
            
            if (result.success) {
                setPendingEmail(email);
                setShowVerification(true);
            } else {
                setError(result.message || 'Failed to send verification email');
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('Failed to send verification email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerificationSuccess = async () => {
        setLoading(true);
        try {
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
                console.warn('Using default settings');
            }

            // Create Firebase account
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(pendingEmail, password);
            const user = userCredential.user;

            const apiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);

            const userName = name || pendingEmail.split('@')[0];
            const profilePicture = generateProfilePicture(userName);
            const userReferralCode = user.uid.substring(0, 8).toUpperCase();

            let totalBonus = welcomeBonus;
            let referrerId = null;

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

                        await window.firebaseDB.collection('users').doc(referrerId).update({
                            balance: firebase.firestore.FieldValue.increment(referralBonusAmount)
                        });

                        await window.firebaseDB.collection('users').doc(referrerId).collection('transactions').add({
                            type: 'referral',
                            amount: referralBonusAmount,
                            from: pendingEmail,
                            description: `Referral bonus from ${pendingEmail}`,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        await window.firebaseDB.collection('users').doc(referrerId).collection('notifications').add({
                            type: 'announcement',
                            title: '🎉 Referral Bonus Earned!',
                            message: `You earned ${referralBonusAmount} coins for referring ${pendingEmail}!`,
                            amount: 0,
                            claimed: true,
                            read: false,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                } catch (refError) {
                    console.error('Referral error:', refError);
                }
            }

            await window.firebaseDB.collection('users').doc(user.uid).set({
                name: userName,
                email: pendingEmail,
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
                emailVerified: true
            });

            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'signup_bonus',
                amount: totalBonus,
                description: referrerId 
                    ? `Welcome bonus (${welcomeBonus}) + Referral bonus (${referralBonusAmount})` 
                    : `Welcome bonus (${welcomeBonus})`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('users').doc(user.uid).collection('notifications').add({
                type: 'announcement',
                title: '🎉 Welcome to KaliyaX API!',
                message: `Account created! You received ${totalBonus} coins${referrerId ? ' (including referral bonus!)' : ''}`,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('✅ Account created successfully!');
        } catch (err) {
            console.error('Account creation error:', err);
            setError('Failed to create account. Please try again.');
            setShowVerification(false);
        } finally {
            setLoading(false);
        }
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
            }

            const result = await window.firebaseAuth.signInWithPopup(authProvider);
            const user = result.user;

            const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
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
                    console.warn('Using defaults');
                }

                const apiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + 
                              Math.random().toString(36).substring(2, 15);

                const userName = user.displayName || user.email.split('@')[0];
                const profilePicture = user.photoURL || generateProfilePicture(userName);
                const userReferralCode = user.uid.substring(0, 8).toUpperCase();

                let totalBonus = welcomeBonus;
                let referrerId = null;

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

                            await window.firebaseDB.collection('users').doc(referrerId).update({
                                balance: firebase.firestore.FieldValue.increment(referralBonusAmount)
                            });

                            await window.firebaseDB.collection('users').doc(referrerId).collection('transactions').add({
                                type: 'referral',
                                amount: referralBonusAmount,
                                from: user.email,
                                description: `Referral bonus from ${user.email}`,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    } catch (refError) {
                        console.error('Referral error:', refError);
                    }
                }

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

                await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                    type: 'signup_bonus',
                    amount: totalBonus,
                    description: referrerId 
                        ? `Welcome bonus (${welcomeBonus}) + Referral bonus (${referralBonusAmount})` 
                        : `Welcome bonus (${welcomeBonus})`,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                if (userDoc.data().status === 'suspended') {
                    await window.firebaseAuth.signOut();
                    setError('Your account has been suspended');
                    setLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.error('OAuth error:', err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled');
            } else if (err.code === 'auth/account-exists-with-different-credential') {
                setError('Account already exists with this email');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (showVerification) {
        return (
            <EmailVerification 
                email={pendingEmail}
                type="signup"
                onVerified={handleVerificationSuccess}
                onBack={() => {
                    setShowVerification(false);
                    setPendingEmail('');
                }}
            />
        );
    }

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
                            <h2 className="text-3xl font-bold mb-2">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="text-slate-400">
                                {isLogin ? 'Sign in to your dashboard' : 'Join thousands of developers'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                            {!isLogin && (
                                <input 
                                    type="text" 
                                    placeholder="Name (optional)" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                                />
                            )}
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                            />
                            {!isLogin && (
                                <>
                                    <input 
                                        type="password" 
                                        placeholder="Confirm Password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                                    />
                                    {referralCode && (
                                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <p className="text-green-400 text-sm font-semibold">
                                                🎉 Referral code applied! Extra 60 coins bonus
                                            </p>
                                            <p className="text-green-300 text-xs mt-1">
                                                Code: {referralCode}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                                    </>
                                ) : (
                                    isLogin ? 'Log In' : 'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="my-6 flex items-center">
                            <div className="flex-1 border-t border-slate-700"></div>
                            <span className="px-4 text-slate-400 text-sm">Or continue with</span>
                            <div className="flex-1 border-t border-slate-700"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                className="py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-slate-700"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.27 9.76A7.5 7.5 0 0 1 19.5 12h-7.02v3h4.52a3.99 3.99 0 0 1-6 2.24v2.76h2.76A7.48 7.48 0 0 0 19.5 12c0-.58-.05-1.14-.14-1.68H12.48v3.44z"/>
                                    <path fill="#4285F4" d="M12 20a7.48 7.48 0 0 0 5.26-1.93l-2.56-1.99A4.73 4.73 0 0 1 7.5 12H4.53v2.58A7.5 7.5 0 0 0 12 20z"/>
                                    <path fill="#FBBC05" d="M7.5 12a4.5 4.5 0 0 1 0-2.92V6.5H4.53a7.5 7.5 0 0 0 0 7.08z"/>
                                    <path fill="#34A853" d="M12 7.5c1.16 0 2.19.4 3.01 1.18l2.26-2.26A7.5 7.5 0 0 0 4.53 9.08L7.5 11.5A4.48 4.48 0 0 1 12 7.5z"/>
                                </svg>
                                <span>Google</span>
                            </button>

                            <button 
                                onClick={() => handleOAuthLogin('github')}
                                disabled={loading}
                                className="py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2 border border-slate-700"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                <span>GitHub</span>
                            </button>
                        </div>

                        <div className="mt-6 text-center text-slate-400">
                            {isLogin ? (
                                <>
                                    New here? <button onClick={() => setIsLogin(false)} className="text-purple-400 hover:text-purple-300 font-semibold">Create Account</button>
                                </>
                            ) : (
                                <>
                                    Already have an account? <button onClick={() => setIsLogin(true)} className="text-purple-400 hover:text-purple-300 font-semibold">Log In</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
