function OverviewTab({ userData, user, copied, copyApiKey, regenerateApiKey }) {
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferEmail, setTransferEmail] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    const handleTransfer = async () => {
        if (!transferAmount || !transferEmail) {
            alert('කරුණාකර සියලු තොරතුරු පුරවන්න!');
            return;
        }

        const amount = parseInt(transferAmount);
        if (amount <= 0 || amount > userData.balance) {
            alert('වලංගු නොවන මුදලක්!');
            return;
        }

        try {
            const recipientQuery = await window.firebaseDB.collection('users')
                .where('email', '==', transferEmail)
                .get();

            if (recipientQuery.empty) {
                alert('පරිශීලකයා හමු නොවීය!');
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
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('users').doc(recipientId).collection('transactions').add({
                type: 'transfer_received',
                amount: amount,
                from: userData.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('සාර්ථකව මාරු විය!');
            setShowTransfer(false);
            setTransferAmount('');
            setTransferEmail('');
            window.location.reload();
        } catch (error) {
            console.error('Transfer error:', error);
            alert('මාරු කිරීමේ දෝෂයක්!');
        }
    };

    const buyPackage = async (coins, price) => {
        try {
            await window.firebaseDB.collection('users').doc(user.uid).update({
                balance: firebase.firestore.FieldValue.increment(coins)
            });

            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'purchase',
                amount: coins,
                price: price,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`සාර්ථකව ${coins} coins මිල දී ගන්නා ලදී!`);
            window.location.reload();
        } catch (error) {
            console.error('Purchase error:', error);
            alert('මිලදී ගැනීමේ දෝෂයක්!');
        }
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Hello, {userData?.name || 'Developer'} 👋</h1>
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
                    <div className="text-3xl font-bold capitalize">{userData?.status || 'Active'}</div>
                    <p className="text-slate-400 text-sm mt-1">account status</p>
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
                    <div className="text-3xl font-bold">5</div>
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
                        <span className="text-green-400 text-sm bg-green-500/10 px-3 py-1 rounded-full border border-green-500/30">
                            {copied ? 'Copied!' : 'Active'}
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
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">Earn Coins</h3>
                    <div className="text-3xl font-bold mb-2">+60 Bonus</div>
                    <p className="text-purple-100 text-sm mb-4">Share your referral link and earn rewards instantly.</p>
                    <button className="w-full py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                        Share Now
                    </button>
                </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 mb-8">
                <h2 className="text-xl font-bold mb-2">Coin Packages</h2>
                <p className="text-slate-400 mb-6">Secure & Instant Top-up</p>
                <div className="grid md:grid-cols-3 gap-6">
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
        </>
    );
}
