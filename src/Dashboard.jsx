// FILE: src/Dashboard.jsx

function Dashboard({ user }) {
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        loadUserData();
        
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
        if (confirm('This will invalidate your current API key. Continue?')) {
            const newApiKey = 'kx_live_' + Math.random().toString(36).substring(2, 15) + 
                             Math.random().toString(36).substring(2, 15);
            
            try {
                await window.firebaseDB.collection('users').doc(user.uid).update({
                    apiKey: newApiKey
                });
                
                alert('✅ API Key regenerated successfully!');
            } catch (error) {
                console.error('Error regenerating API key:', error);
            }
        }
    };

    const toggleApiKeyPause = async () => {
        const newStatus = !userData.apiKeyPaused;
        
        try {
            await window.firebaseDB.collection('users').doc(user.uid).update({
                apiKeyPaused: newStatus
            });
            
            alert(newStatus ? '⏸️ API Key paused' : '▶️ API Key resumed');
        } catch (error) {
            console.error('Error toggling API key:', error);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowMenu(false);
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

    if (userData?.status === 'suspended') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Account Suspended ⚠️</h1>
                    <p className="text-slate-400 mb-6">Your account has been suspended by admin.</p>
                    
                    <a 
                        href="https://wa.me/94771198299?text=Please%20KX%2C%20Release%20My%20Api%20User%20Account%20😿"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="flex items-center">
                            Contact KaliyaX 
                            <svg className="w-4 h-4 ml-1 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </span>
                    </a>
                    
                    <div className="text-slate-500 text-sm mb-6">WhatsApp: +94 77 119 8299</div>
                    
                    <button onClick={handleLogout} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
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
                            <span className="text-xl font-bold hidden sm:inline">KaliyaX API</span>
                        </div>
                        
                        <div className="hidden lg:flex items-center space-x-6">
                            <button onClick={() => handleTabChange('overview')} className={`px-3 py-2 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>Overview</button>
                            <button onClick={() => handleTabChange('apis')} className={`px-3 py-2 rounded-lg transition-colors ${activeTab === 'apis' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>API Library</button>
                            <button onClick={() => handleTabChange('transactions')} className={`px-3 py-2 rounded-lg transition-colors ${activeTab === 'transactions' ? 'bg-purple-600' : 'hover:bg-slate-800'}`}>Transactions</button>
                            
                            <NotificationBar user={user} />
                            
                            <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                </svg>
                                <span className="font-bold">{userData?.balance || 0}</span>
                            </div>

                            <button onClick={() => setShowProfile(true)} className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-purple-500">
                                <img src={userData?.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            </button>
                            
                            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>

                        <button onClick={() => setShowMenu(!showMenu)} className="lg:hidden">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {showMenu && (
                        <div className="lg:hidden mt-4 space-y-2 pb-4 animate-fade-in">
                            <button onClick={() => handleTabChange('overview')} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">📊 Overview</button>
                            <button onClick={() => handleTabChange('apis')} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">🔌 API Library</button>
                            <button onClick={() => handleTabChange('transactions')} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">💳 Transactions</button>
                            <button onClick={() => { setShowProfile(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg">👤 Profile</button>
                            <div className="px-4 py-2 flex items-center space-x-2">
                                <span className="font-bold">💰 Balance: {userData?.balance || 0}</span>
                            </div>
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-slate-800 rounded-lg text-red-400">🚪 Logout</button>
                        </div>
                    )}
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && <OverviewTab userData={userData} user={user} copied={copied} copyApiKey={copyApiKey} regenerateApiKey={regenerateApiKey} toggleApiKeyPause={toggleApiKeyPause} />}
                {activeTab === 'apis' && <ApiLibraryTab />}
                {activeTab === 'transactions' && <TransactionsTab user={user} />}
            </div>

            {showProfile && (
                <UserProfile
                    user={user}
                    userData={userData}
                    onClose={() => setShowProfile(false)}
                    onUpdate={loadUserData}
                />
            )}

            <Footer />
        </div>
    );
}
