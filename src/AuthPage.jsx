function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check if email is verified
            if (!user.emailVerified) {
                await window.firebaseAuth.signOut();
                setError('Please verify your email before logging in. Check your inbox.');
                setLoading(false);
                return;
            }

            // Check if user is suspended
            const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().status === 'suspended') {
                await window.firebaseAuth.signOut();
                setError('Your account has been suspended. Please contact admin.');
                setLoading(false);
                return;
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

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
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Send email verification
            await user.sendEmailVerification();

            const apiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Create user document
            await window.firebaseDB.collection('users').doc(user.uid).set({
                name: name || email.split('@')[0],
                email: email,
                apiKey: apiKey,
                balance: 160,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                totalCalls: 0,
                status: 'active',
                emailVerified: false
            });

            // Add welcome transaction
            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'signup_bonus',
                amount: 160,
                description: 'Welcome bonus + Referral bonus',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Add welcome notification
            await window.firebaseDB.collection('users').doc(user.uid).collection('notifications').add({
                type: 'announcement',
                title: 'Welcome to KaliyaX API! 🎉',
                message: 'Your account has been created successfully. You received 160 coins as welcome bonus!',
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Sign out user after signup
            await window.firebaseAuth.signOut();

            setSuccess('Account created! Please check your email to verify your account before logging in.');
            setEmailSent(true);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setName('');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        setError('');
        setLoading(true);

        try {
            const methods = await window.firebaseAuth.fetchSignInMethodsForEmail(email);
            if (methods.length > 0) {
                // Sign in temporarily to resend verification
                const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                await userCredential.user.sendEmailVerification();
                await window.firebaseAuth.signOut();
                setSuccess('Verification email sent! Please check your inbox.');
            } else {
                setError('Email not found!');
            }
        } catch (err) {
            setError(err.message);
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
                        <a href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">
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
                            {!isLogin && (
                                <div className="mt-4 inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-2 rounded-full text-sm">
                                    <span>Signup Bonus</span>
                                    <span className="font-bold">+160 Coins</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        {emailSent && (
                            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <p className="text-blue-400 text-sm mb-2">📧 Verification email sent!</p>
                                <p className="text-slate-400 text-xs">Please check your inbox and verify your email before logging in.</p>
                                <button 
                                    onClick={resendVerification}
                                    className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Didn't receive? Resend email
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
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
                                <input 
                                    type="password" 
                                    placeholder="Confirm Password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                                />
                            )}
                            <button 
                                onClick={isLogin ? handleLogin : handleSignup}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Create Account')}
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
