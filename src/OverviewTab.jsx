// FILE: src/OverviewTab.jsx
// Overview Tab Component - Complete Fixed Version

function OverviewTab({ userData, user, copied, copyApiKey, regenerateApiKey, toggleApiKeyPause }) {
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferEmail, setTransferEmail] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [showReferral, setShowReferral] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);
    const [apiCost, setApiCost] = useState(5);
    const [referralBonus, setReferralBonus] = useState(60);
    const [customCoins, setCustomCoins] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settingsDoc = await window.firebaseDB.collection('settings').doc('system').get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                setApiCost(settings.apiCostPerCall || 5);
                setReferralBonus(settings.referralBonus || 60);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const getReferralLink = () => {
        return `${window.location.origin}?ref=${userData?.referralCode}`;
    };

    const copyReferralLink = () => {
        navigator.clipboard.writeText(getReferralLink());
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    const shareReferral = () => {
        const message = `Join KaliyaX API and get bonus coins! Use my referral link: ${getReferralLink()}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleTransfer = async () => {
        if (!transferAmount || !transferEmail) {
            alert('❌ Please fill all fields!');
            return;
        }

        const amount = parseInt(transferAmount);
        if (amount <= 0 || amount > userData.balance) {
            alert('❌ Invalid amount!');
            return;
        }

        if (transferEmail === userData.email) {
            alert('❌ Cannot transfer to yourself!');
            return;
        }

        try {
            const recipientQuery = await window.firebaseDB.collection('users')
                .where('email', '==', transferEmail)
                .limit(1)
                .get();

            if (recipientQuery.empty) {
                alert('❌ User not found!');
                return;
            }

            const recipientDoc = recipientQuery.docs[0];
            const recipientId = recipientDoc.id;

            await window.firebaseDB.collection('users').doc(user.uid).update({
                balance: firebase.firestore.FieldValue.increment(-amount)
            });

            await window.firebaseDB.collection('users').doc(recipientId).update({
                balance: firebase.firestore.FieldValue.increment(amount)
            });

            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'transfer_sent',
                amount: -amount,
                to: transferEmail,
                description: `Transferred ${amount} coins to ${transferEmail}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('users').doc(recipientId).collection('transactions').add({
                type: 'transfer_received',
                amount: amount,
                from: userData.email,
                description: `Received ${amount} coins from ${userData.email}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('users').doc(recipientId).collection('notifications').add({
                type: 'coin_reward',
                title: 'Coins Received',
                message: `You received ${amount} coins from ${userData.email}`,
                amount: 0,
                claimed: true,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('✅ Transfer successful!');
            setShowTransfer(false);
            setTransferAmount('');
            setTransferEmail('');
        } catch (error) {
            console.error('Transfer error:', error);
            alert('❌ Transfer failed!');
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

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6">
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

                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-purple-500/50 transition-all" onClick={() => setShowReferral(true)}>
                    <h3 className="text-xl font-bold mb-2">Earn Coins</h3>
                    <div className="text-3xl font-bold mb-2">+{referralBonus} Bonus</div>
                    <p className="text-purple-100 text-sm mb-4">Share your referral link and earn rewards instantly.</p>
                    <button className="w-full py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                        Share Now
                    </button>
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

            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6">
                <h2 className="text-xl font-bold mb-4">Send Coins to Friend</h2>
                <p className="text-slate-400 mb-6">Transfer your coins to another developer's account instantly.</p>
                {!showTransfer ? (
                    <button onClick={() => setShowTransfer(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors">
                        Transfer Coins
                    </button>
                ) : (
                    <div className="space-y-4">
                        <input 
                            type="email" 
                            placeholder="Recipient Email" 
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                        <input 
                            type="number" 
                            placeholder="Amount" 
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                        <div className="flex flex-wrap gap-3">
                            <button onClick={handleTransfer} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors">Send</button>
                            <button onClick={() => setShowTransfer(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors border border-slate-700">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {showReferral && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowReferral(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Share & Earn</h2>
                        <p className="text-slate-400 mb-6">Share your referral link and earn {referralBonus} coins for each signup!</p>
                        
                        <div className="bg-slate-950 rounded-lg p-4 mb-4 break-all text-sm border border-slate-800">
                            {getReferralLink()}
                        </div>

                        <div className="space-y-3">
                            <button onClick={copyReferralLink} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors">
                                {copiedReferral ? '✅ Copied!' : 'Copy Link'}
                            </button>
                            <button onClick={shareReferral} className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                <span>Share on WhatsApp</span>
                            </button>
                            <button onClick={() => setShowReferral(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
