// FILE: src/AdminLogin.jsx
// Admin Login with Hardcoded Credentials

const { useState } = React;

// ✅ HARDCODED ADMIN CREDENTIALS
const ADMIN_CREDENTIALS = {
    username: 'Kaliyax',
    password: '@kx200'
};

function AdminLogin({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Simulate loading delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check credentials
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                console.log('✅ Admin login successful');
                
                // Store in session
                sessionStorage.setItem('kaliyax_admin_session', 'true');
                sessionStorage.setItem('kaliyax_admin_username', username);
                
                // Call parent login handler
                onLogin(username);
            } else {
                setError('❌ Invalid username or password!');
                console.log('❌ Login failed - Invalid credentials');
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('Login failed! Please try again.');
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
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center font-bold text-4xl mx-auto mb-4">
                            A
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Admin Login</h2>
                        <p className="text-slate-400">Access the admin panel</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center space-x-2 animate-fade-in">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-2 font-semibold">Username</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Enter username" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white"
                                    disabled={loading}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-slate-400 text-sm mb-2 font-semibold">Password</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-white"
                                    disabled={loading}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Login as Admin</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
                            Back to User Portal
                        </a>
                    </div>
                </div>

                <div className="mt-6 text-center text-slate-400 text-sm">
                    <p>⚠️ Admin access only</p>
                    <p className="mt-2 text-xs">Username: <span className="text-red-400 font-mono">Kaliyax</span></p>
                    <p className="text-xs">Password: <span className="text-red-400 font-mono">@kx200</span></p>
                </div>
            </div>
        </div>
    );
}
