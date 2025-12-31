// FILE: src/AdminLogin.jsx
// Admin Login - Google OAuth ONLY for kaliya.x.git@gmail.com

function AdminLogin({ onLogin }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Force account selection
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            console.log('🔐 Starting Google sign-in...');
            const result = await window.firebaseAuth.signInWithPopup(provider);
            const user = result.user;

            console.log('👤 User signed in:', user.email);

            // ✅ CRITICAL CHECK: Only kaliya.x.git@gmail.com
            if (user.email === 'kaliya.x.git@gmail.com') {
                console.log('✅ ADMIN ACCESS GRANTED');
                onLogin(user.email);
            } else {
                console.log('❌ ACCESS DENIED for:', user.email);
                
                // Sign out unauthorized user
                await window.firebaseAuth.signOut();
                
                setError(`🚫 Access Denied!\n\nOnly kaliya.x.git@gmail.com can access the admin panel.\n\nYou tried to login with: ${user.email}`);
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            
            if (err.code === 'auth/popup-closed-by-user') {
                setError('⚠️ Sign-in cancelled');
            } else if (err.code === 'auth/popup-blocked') {
                setError('⚠️ Popup blocked! Please allow popups for this site.');
            } else if (err.code === 'auth/cancelled-popup-request') {
                setError('⚠️ Another popup is already open');
            } else {
                setError(err.message || '❌ Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaDJWNjBoLTJ6TTAgMzZoMzB2Mkgwdi0yem0zMCAwaDMwdjJIMzB2LTJ6Ij48L3BhdGg+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center font-bold text-4xl mx-auto mb-4 shadow-lg">
                            A
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Admin Login</h2>
                        <p className="text-slate-400">Secure access to admin panel</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-fade-in">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="whitespace-pre-line">{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-blue-400 text-sm font-semibold mb-1">🔒 Restricted Access</p>
                                <p className="text-blue-300 text-xs">
                                    Only <strong className="text-blue-200">kaliya.x.git@gmail.com</strong> has admin privileges.<br/>
                                    Other accounts will be <strong className="text-blue-200">automatically rejected</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 border border-gray-300 shadow-md hover:shadow-lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.27 9.76A7.5 7.5 0 0 1 19.5 12h-7.02v3h4.52a3.99 3.99 0 0 1-6 2.24v2.76h2.76A7.48 7.48 0 0 0 19.5 12c0-.58-.05-1.14-.14-1.68H12.48v3.44z"/>
                                    <path fill="#4285F4" d="M12 20a7.48 7.48 0 0 0 5.26-1.93l-2.56-1.99A4.73 4.73 0 0 1 7.5 12H4.53v2.58A7.5 7.5 0 0 0 12 20z"/>
                                    <path fill="#FBBC05" d="M7.5 12a4.5 4.5 0 0 1 0-2.92V6.5H4.53a7.5 7.5 0 0 0 0 7.08z"/>
                                    <path fill="#34A853" d="M12 7.5c1.16 0 2.19.4 3.01 1.18l2.26-2.26A7.5 7.5 0 0 0 4.53 9.08L7.5 11.5A4.48 4.48 0 0 1 12 7.5z"/>
                                </svg>
                                <span>Sign in with Google</span>
                            </>
                        )}
                    </button>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors inline-flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to User Portal</span>
                        </a>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <div className="inline-flex items-center space-x-2 text-slate-400 text-sm bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Secure admin authentication</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
