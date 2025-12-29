// FILE: src/TransactionsTab.jsx
// Transactions Tab Component

function TransactionsTab({ user }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, [user]);

    const loadTransactions = async () => {
        try {
            const snapshot = await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('transactions')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            setTransactions(txs);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTransactionIcon = (type) => {
        switch(type) {
            case 'purchase':
                return (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'usage':
                return (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                );
            case 'transfer_sent':
                return (
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                );
            case 'transfer_received':
                return (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                );
            case 'signup_bonus':
            case 'referral':
            case 'admin_credit':
                return (
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
        }
    };

    const getTransactionTitle = (tx) => {
        switch(tx.type) {
            case 'purchase':
                return `Purchased ${tx.amount} coins`;
            case 'usage':
                return tx.endpoint || 'API Call';
            case 'transfer_sent':
                return `Sent to ${tx.to}`;
            case 'transfer_received':
                return `Received from ${tx.from}`;
            case 'signup_bonus':
                return 'Welcome Bonus';
            case 'referral':
                return `Referral from ${tx.from}`;
            case 'admin_credit':
                return 'Admin Credit';
            case 'admin_deduct':
                return 'Admin Deduction';
            default:
                return tx.description || 'Transaction';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Just now';
        
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading transactions...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
                <p className="text-slate-400">View all your account transactions</p>
            </div>

            {transactions.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-12 text-center">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
                    <p className="text-slate-400">Your transaction history will appear here</p>
                </div>
            ) : (
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left p-4 text-slate-400 font-semibold">Type</th>
                                    <th className="text-left p-4 text-slate-400 font-semibold">Details</th>
                                    <th className="text-right p-4 text-slate-400 font-semibold">Amount</th>
                                    <th className="text-right p-4 text-slate-400 font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                                                    {getTransactionIcon(tx.type)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="font-semibold">{getTransactionTitle(tx)}</p>
                                                {tx.price && (
                                                    <p className="text-slate-400 text-sm">{tx.price}</p>
                                                )}
                                                {tx.description && tx.type !== 'signup_bonus' && (
                                                    <p className="text-slate-400 text-sm">{tx.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`font-bold text-lg ${
                                                tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </span>
                                            <span className="text-slate-400 ml-1">coins</span>
                                        </td>
                                        <td className="p-4 text-right text-slate-400 text-sm">
                                            {formatDate(tx.timestamp)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );
}
