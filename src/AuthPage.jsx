// FILE: src/AuthPage.jsx
// Authentication Page Component

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getReferralCode = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref');
    };

    const generateApiKey = () => {
        return 'kx_live_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    };

    const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

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

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                window.showToast('Successfully logged in! 🎉', 'success');
            } else {
                if (!name.trim()) {
                    setError('Please enter your name');
                    setLoading(false);
                    return;
                }

                const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                const referralCode = getReferralCode();
                let signupBonus = 100;
                let referralBonus = 60;

                const settingsDoc = await window.firebaseDB.collection('settings').doc('system').get();
                if (settingsDoc.exists) {
                    const settings = settingsDoc.data();
                    signupBonus = settings.welcomeBonus || 100;
                    referralBonus = settings.referralBonus || 60;
                }

                const totalBonus = signupBonus + referralBonus;
                const profilePicture = generateProfilePicture(name);

                await window.firebaseDB.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    apiKey: generateApiKey(),
                    referralCode: generateReferralCode(),
                    balance: totalBonus,
                    totalCalls: 0,
                    status: 'active',
                    apiKeyPaused: false,
                    profilePicture: profilePicture,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                    type: 'signup_bonus',
                    amount: signupBonus,
                    description: 'Welcome bonus for signing up',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                    type: 'referral',
                    amount: referralBonus,
                    description: 'Referral bonus',
                    from: referralCode || 'Direct signup',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

                if (referralCode) {
                    const referrerQuery = await window.firebaseDB.collection('users')
                        .where('referralCode', '==', referralCode)
                        .limit(1)
                        .get();

                    if (!referrerQuery.empty) {
                        const referrerDoc = referrerQuery.docs[0];
                        const referrerId = referrerDoc.id;

                        await window.firebaseDB.collection('users').doc(referrerId).update({
                            balance: firebase.firestore.FieldValue.increment(referralBonus)
                        });

                        await window.firebaseDB.collection('users').doc(referrerId).collection('transactions').add({
                            type: 'referral',
                            amount: referralBonus,
                            from: email,
                            description: `Referral bonus from ${email}`,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                }

                window.showToast(`Account created! You got ${totalBonus} coins! 🎉`, 'success');
            }
        } catch (err) {
            console.error('Auth error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address');
            } else if (err.code === 'auth/user-not-found') {
                setError('User not found');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else {
                setError(err.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaDJWNjBoLTJ6TTAgMzZoMzB2Mkgwdi0yem0zMCAwaDMwdjJIMzB2LTJ6Ij48L3BhdGg+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center font-bold text-4xl mx-auto mb-4">
                            K
                        </div>
                        <h2 className="text-3xl font-bold mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="text-slate-400">
                            {isLogin ? 'Login to access your API dashboard' : 'Get started with KaliyaX API'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center space-x-2 animate-fade-in">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Full Name</label>
                                <input 
                                    type="text" 
                                    placeholder="John Doe" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Email</label>
                            <input 
                                type="email" 
                                placeholder="you@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                disabled={loading}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Password</label>
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                disabled={loading}
                                required
                                minLength="6"
                            />
                        </div>

                        {!isLogin && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 text-sm">
                                🎁 Get 160 coins bonus on signup!
                            </div>
                        )}
                        
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{isLogin ? 'Logging in...' : 'Creating account...'}</span>
                                </>
                            ) : (
                                <span>{isLogin ? 'Login' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                            disabled={loading}
                        >
                            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center text-slate-400 text-sm">
                    <p>By continuing, you agree to our Terms & Privacy Policy</p>
                </div>
            </div>
        </div>
    );
}
