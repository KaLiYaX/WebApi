function Dashboard({ user }) {
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        loadUserData();
        
        // Real-time listener for user data updates
        const unsubscribe = window.firebaseDB.collection('users').doc(user.uid).onSnapshot((doc) => {
            if (doc.exists) {
                setUserData(doc.data());
            }
        });

        return () => unsubscribe();
    }, [user]);

    const loadUserData = async () => {
        try {
            const doc = await window.firebaseDB.collection('users').doc(user.uid).get();
            if (doc.exists) {
                setUserData(doc.data());
                
                // Update emailVerified status if verified
                if (user.emailVerified && !doc.data().emailVerified) {
                    await window.firebaseDB.collection('users').doc(user.uid).update({
                        emailVerified: true
                    });
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await window.firebaseAuth.signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const copyApiKey = () => {
        if (userData?.apiKey) {
            navigator.clipboard.writeText(userData.apiKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const regenerateApiKey = async () => {
        if (confirm('මෙය ඔබගේ වත්මන් API key එක අවලංගු කරයි. දිගටම යන්නද?')) {
            const newApiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            try {
                await window.firebaseDB.collection('users').doc(user.uid).update({
                    apiKey: newApiKey
                });
                
                setUserData({ ...userData, apiKey: newApiKey });
                alert('API Key regenerated successfully!');
            } catch (error) {
                console.error('Error regenerating API key:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Check if user is suspended
    if (userData?.status === 'suspended') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Account Suspended</h1>
                    <p className="text-slate-400 mb-6">Your account has been suspended by admin. Please contact support.</p>
                    <button onClick={handleLogout} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaDJWNjBoLTJ6TTAgMzZoMzB2Mkgwdi0yem0zMCAwaDMwdjJIMzB2LTJ6Ij48L3BhdGg+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

            <nav className="relative z-10 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center font-bold text-xl">K</div>
                            <span className="text-xl font-bold">KaliyaX API</span>
                        </div>
                        
                        <div className="hidden md:flex items-center space-x-6">
                            <button onClick={() => setActiveTab('overview')} className={`px-3 py-2 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>Overview</button>
                            <button onClick={() => setActiveTab('apis')} className={`px-3 py-2 rounded-lg transition-colors ${activeTab === 'apis' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>API Library</button>
                            <button onClick={() => setActiveTab('transactions')} className={`px-3 py-2 rounded-lg transition-colors ${activeTab === 'transactions' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>Transactions</button>
                            
                            {/* Notification Bell */}
                            <NotificationBar user={user} />
                            
                            <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                </svg>
                                <span className="font-bold">{userData?.balance || 0}</span>
                            </div>
                            
                            <button onClick={handleLogout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>

                        <button onClick={() => setShowMenu(!showMenu)} className="md:hidden">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {showMenu && (
                        <div className="md:hidden mt-4 space-y-2 pb-4">
                            <button onClick={() => setActiveTab('overview')} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">Overview</button>
                            <button onClick={() => setActiveTab('apis')} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">API Library</button>
                            <button onClick={() => setActiveTab('transactions')} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">Transactions</button>
                            <div className="px-4 py-2 flex items-center space-x-2">
                                <span className="font-bold">Balance: {userData?.balance || 0} coins</span>
                            </div>
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg text-red-400">Logout</button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && <OverviewTab userData={userData} user={user} copied={copied} copyApiKey={copyApiKey} regenerateApiKey={regenerateApiKey} />}
                {activeTab === 'apis' && <ApiLibraryTab />}
                {activeTab === 'transactions' && <TransactionsTab user={user} />}
            </div>

            <Footer />
        </div>
    );
}
