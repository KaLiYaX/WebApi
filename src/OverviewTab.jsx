// FILE: src/OverviewTab.jsx
// Overview Tab Component - NO TRANSFER, NO REFERRAL, WITH DAILY CLAIM (API Docs Section Removed)

function OverviewTab({ userData, user, copied, copyApiKey, regenerateApiKey, toggleApiKeyPause }) {
    const [apiCost, setApiCost] = useState(5);
    const [customCoins, setCustomCoins] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [dailyCoins, setDailyCoins] = useState(100);
    const [claimLoading, setClaimLoading] = useState(false);
    const [lastClaimDate, setLastClaimDate] = useState(null);
    const [canClaim, setCanClaim] = useState(false);

    useEffect(() => {
        loadSettings();
        checkDailyClaim();
    }, [userData]);

    const loadSettings = async () => {
        try {
            const settingsDoc = await window.firebaseDB.collection('settings').doc('system').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                setApiCost(settings.apiCostPerCall || 5);
                setDailyCoins(settings.dailyClaimCoins || 100);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const checkDailyClaim = async () => {
        if (!userData) return;

        try {
            const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
            const data = userDoc.data();
            
            if (data.lastClaimDate) {
                const lastClaim = data.lastClaimDate.toDate();
                const today = new Date();
                
                // Reset time to start of day for comparison
                lastClaim.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                
                setLastClaimDate(lastClaim);
                setCanClaim(lastClaim.getTime() < today.getTime());
            } else {
                // Never claimed before
                setCanClaim(true);
            }
        } catch (error) {
            console.error('Error checking daily claim:', error);
        }
    };

    const claimDailyCoins = async () => {
        if (!canClaim) {
            alert('❌ You have already claimed today! Come back tomorrow.');
            return;
        }

        setClaimLoading(true);

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Update user balance and last claim date
            await window.firebaseDB.collection('users').doc(user.uid).update({
                balance: firebase.firestore.FieldValue.increment(dailyCoins),
                lastClaimDate: firebase.firestore.Timestamp.fromDate(new Date())
            });

            // Add transaction
            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'daily_claim',
                amount: dailyCoins,
                description: `Daily coin claim: ${dailyCoins} coins`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Add notification
            await window.firebaseDB.collection('users').doc(user.uid).collection('notifications').add({
                type: 'success',
                title: '🎉 Daily Coins Claimed!',
                message: `You received ${dailyCoins} coins! Come back tomorrow for more.`,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`✅ Successfully claimed ${dailyCoins} coins!`);
            setCanClaim(false);
            setLastClaimDate(new Date());
        } catch (error) {
            console.error('Error claiming coins:', error);
            alert('❌ Failed to claim coins. Please try again.');
        } finally {
            setClaimLoading(false);
        }
    };

    const buyPackage = async (coins, price) => {
        const message = `Hi KaliyaX! I want to buy ${coins} coins package for ${price}. My email: ${userData.email}`;
        const whatsappUrl = `https://wa.me/94771198299?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const buyCustomPackage = async () => {
        if (!customCoins || !customPrice) {
            alert('❌ Please enter coins and price!');
            return;
        }
        
        const message = `Hi KaliyaX! I want to buy CUSTOM package: ${customCoins} coins for ${customPrice} LKR. My email: ${userData.email}`;
        const whatsappUrl = `https://wa.me/94771198299?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const getTimeUntilNextClaim = () => {
        if (!lastClaimDate) return '';
        
        const now = new Date();
        const tomorrow = new Date(lastClaimDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Hello, {userData?.name || 'Developer'}</h1>
                <p className="text-slate-400">Welcome back! Here's your API overview.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs text-slate-400">Balance</span>
                    </div>
                    <div className="text-3xl font-bold">{userData?.balance || 0}</div>
                    <p className="text-slate-400 text-sm mt-1">coins available</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs text-slate-400">Status</span>
                    </div>
                    <div className="text-3xl font-bold capitalize">{userData?.apiKeyPaused ? 'Paused' : 'Active'}</div>
                    <p className="text-slate-400 text-sm mt-1">API status</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-xs text-slate-400">Total Calls</span>
                    </div>
                    <div className="text-3xl font-bold">{userData?.totalCalls || 0}</div>
                    <p className="text-slate-400 text-sm mt-1">API requests</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-slate-400">Cost/Call</span>
                    </div>
                    <div className="text-3xl font-bold">{apiCost}</div>
                    <p className="text-slate-400 text-sm mt-1">coins per request</p>
                </div>
            </div>

            {/* Daily Claim Section */}
            <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl border border-green-700/50 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center space-x-2">
                            <span>🎁</span>
                            <span>Daily Coin Claim</span>
                        </h2>
                        <p className="text-green-300 text-sm mt-1">Claim {dailyCoins} free coins every day!</p>
                    </div>
                    {!canClaim && lastClaimDate && (
                        <div className="text-right">
                            <div className="text-sm text-slate-400">Next claim in:</div>
                            <div className="text-xl font-bold text-green-400">{getTimeUntilNextClaim()}</div>
                        </div>
                    )}
                </div>

                <button
                    onClick={claimDailyCoins}
                    disabled={!canClaim || claimLoading}
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-green-500/50 flex items-center justify-center space-x-2"
                >
                    {claimLoading ? (
                        <>
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Claiming...</span>
                        </>
                    ) : canClaim ? (
                        <>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                            </svg>
                            <span>Claim {dailyCoins} Coins Now!</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span>Already Claimed Today</span>
                        </>
                    )}
                </button>

                {!canClaim && (
                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm text-center">
                        ✅ You've claimed today! Come back tomorrow for more coins.
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* API Credentials */}
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>API Credentials</span>
                    </h2>
                    <span className={`text-sm px-3 py-1 rounded-full border ${userData?.apiKeyPaused ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' : 'text-green-400 bg-green-500/10 border-green-500/30'}`}>
                        {copied ? 'Copied!' : (userData?.apiKeyPaused ? 'Paused' : 'Active')}
                    </span>
                </div>
                <div className="bg-slate-950/50 rounded-lg p-4 mb-4 font-mono text-sm break-all border border-slate-800">
                    {userData?.apiKey || 'Loading...'}
                </div>
                <p className="text-slate-400 text-sm mb-4">
                    Include in header: <code className="bg-slate-800 px-2 py-1 rounded text-purple-400">x-api-key</code>
                </p>
                <div className="flex flex-wrap gap-3">
                    <button onClick={copyApiKey} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button onClick={regenerateApiKey} className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerate</span>
                    </button>
                    <button onClick={toggleApiKeyPause} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border ${userData?.apiKeyPaused ? 'bg-green-600 hover:bg-green-700 border-green-700' : 'bg-orange-600 hover:bg-orange-700 border-orange-700'}`}>
                        <span>{userData?.apiKeyPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                </div>
            </div>

            {/* API Status Section */}
            <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-2xl border border-blue-700/50 p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>API Status & Health</span>
                </h2>
                <p className="text-blue-300 text-sm mb-6">
                    Monitor the real-time status of all KaliyaX API services
                </p>
                <div className="space-y-3">
                    <a 
                        href="https://status.kaliyax.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-center transition-all flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>View API Status</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                            <div className="text-green-400 font-bold text-lg">99.9%</div>
                            <div className="text-slate-400 text-xs">Uptime</div>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <div className="text-blue-400 font-bold text-lg">~50ms</div>
                            <div className="text-slate-400 text-xs">Response</div>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                            <div className="text-purple-400 font-bold text-lg">24/7</div>
                            <div className="text-slate-400 text-xs">Support</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 mb-8">
                <h2 className="text-xl font-bold mb-2">Coin Packages</h2>
                <p className="text-slate-400 mb-6">Secure & Instant Top-up via WhatsApp</p>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="relative bg-slate-950/50 rounded-xl p-6 border border-slate-800 hover:border-purple-500/50 transition-all">
                        <h3 className="text-lg font-bold mb-2">Starter</h3>
                        <div className="text-3xl font-bold mb-1">500</div>
                        <div className="text-slate-400 text-sm mb-4">Coins</div>
                        <div className="text-2xl font-bold text-purple-400 mb-6">250 LKR</div>
                        <button onClick={() => buyPackage(500, '250 LKR')} className="w-full py-3 rounded-lg font-semibold transition-all bg-slate-800 hover:bg-slate-700 border border-slate-700">
                            Buy Now
                        </button>
                    </div>

                    <div className="relative bg-slate-950/50 rounded-xl p-6 border border-purple-500 ring-2 ring-purple-500/50">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                            MOST POPULAR
                        </div>
                        <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            20% OFF
                        </div>
                        <h3 className="text-lg font-bold mb-2">Pro</h3>
                        <div className="text-3xl font-bold mb-1">2,500</div>
                        <div className="text-slate-400 text-sm mb-4">Coins</div>
                        <div className="text-2xl font-bold text-purple-400 mb-6">1,000 LKR</div>
                        <button onClick={() => buyPackage(2500, '1,000 LKR')} className="w-full py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50">
                            Buy Now
                        </button>
                    </div>

                    <div className="relative bg-slate-950/50 rounded-xl p-6 border border-slate-800 hover:border-purple-500/50 transition-all">
                        <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            28% OFF
                        </div>
                        <h3 className="text-lg font-bold mb-2">Ultimate</h3>
                        <div className="text-3xl font-bold mb-1">5,000</div>
                        <div className="text-slate-400 text-sm mb-4">Coins</div>
                        <div className="text-2xl font-bold text-purple-400 mb-6">1,800 LKR</div>
                        <button onClick={() => buyPackage(5000, '1,800 LKR')} className="w-full py-3 rounded-lg font-semibold transition-all bg-slate-800 hover:bg-slate-700 border border-slate-700">
                            Buy Now
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">Custom Package</h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <input 
                            type="number"
                            placeholder="Number of Coins"
                            value={customCoins}
                            onChange={(e) => setCustomCoins(e.target.value)}
                            className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input 
                            type="number"
                            placeholder="Price in LKR"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button onClick={buyCustomPackage} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:shadow-lg transition-all">
                        Request Custom Package
                    </button>
                </div>
            </div>
        </>
    );
}
