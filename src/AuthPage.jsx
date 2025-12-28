// FILE: src/AuthPage.jsx

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [pendingUser, setPendingUser] = useState(null);

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

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().status === 'suspended') {
                await window.firebaseAuth.signOut();
                setError('Your account has been suspended. Contact support.');
                setLoading(false);
                return;
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
            setError('Passwords do not match!');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters!');
            return;
        }

        setLoading(true);

        try {
            const welcomeDoc = await window.firebaseDB.collection('settings').doc('welcome_bonus').get();
            const welcomeBonus = welcomeDoc.exists ? welcomeDoc.data().bonus : 100;

            const sendEmailFunction = window.firebaseFunctions.httpsCallable('sendVerificationEmail');
            await sendEmailFunction({ email, type: 'signup' });

            setPendingUser({
                email,
                password,
                name: name || email.split('@')[0],
                welcomeBonus,
                referralCode
            });

            setShowEmailVerification(true);
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailVerified = async () => {
        setLoading(true);

        try {
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(
                pendingUser.email, 
                pendingUser.password
            );
            const user = userCredential.user;

            const apiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);

            const profilePicture = generateProfilePicture(pendingUser.name);

            let totalBonus = pendingUser.welcomeBonus;
            let referrerId = null;

            if (pendingUser.referralCode) {
                const referrerQuery = await window.firebaseDB.collection('users')
                    .where('referralCode', '==', pendingUser.referralCode)
                    .limit(1)
                    .get();

                if (!referrerQuery.empty) {
                    referrerId = referrerQuery.docs[0].id;
                    
                    const referralDoc = await window.firebaseDB.collection('settings').doc('referral_bonus').get();
                    const referralBonus = referralDoc.exists ? referralDoc.data().bonus : 40;

                    totalBonus += referralBonus;

                    await window.firebaseDB.collection('users').doc(referrerId).update({
                        balance: firebase.firestore.FieldValue.increment(referralBonus)
                    });

                    await window.firebaseDB.collection('users').doc(referrerId).collection('transactions').add({
                        type: 'referral',
                        amount: referralBonus,
                        from: pendingUser.email,
                        description: `Referral bonus from ${pendingUser.email}`,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    await window.firebaseDB.collection('users').doc(referrerId).collection('notifications').add({
                        type: 'coin_reward',
                        title: 'Referral Bonus! 🎉',
                        message: `You earned ${referralBonus} coins for referring ${pendingUser.email}. Click to claim!`,
                        amount: referralBonus,
                        claimed: false,
                        read: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            const userReferralCode = user.uid.substring(0, 8).toUpperCase();

            await window.firebaseDB.collection('users').doc(user.uid).set({
                name: pendingUser.name,
                email: pendingUser.email,
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
                    ? `Welcome bonus + Referral bonus` 
                    : 'Welcome bonus',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('users').doc(user.uid).collection('notifications').add({
                type: 'announcement',
                title: 'Welcome to KaliyaX API! 🎉',
                message: `Your account has been created successfully. You received ${totalBonus} coins as bonus!`,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (showEmailVerification) {
        return (
            <EmailVerification
                email={pendingUser.email}
                onVerified={handleEmailVerified}
                type="signup"
                onBack={() => {
                    setShowEmailVerification(false);
                    setPendingUser(null);
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
                            Admin Login →
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
                                {isLogin ? 'Sign in to access your developer dashboard' : 'Join thousands of developers'}
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
                                            <p className="text-green-400 text-sm">
                                                🎉 Referral code applied! You'll get extra bonus coins
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Create Account')}
                            </button>
                        </form>

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
