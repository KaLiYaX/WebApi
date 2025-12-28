function AdminPanel({ onLogout }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAddCoins, setShowAddCoins] = useState(false);
    const [showDeductCoins, setShowDeductCoins] = useState(false);
    const [showApiCost, setShowApiCost] = useState(false);
    const [showBulkCoins, setShowBulkCoins] = useState(false);
    const [showSendNotification, setShowSendNotification] = useState(false);
    const [coinAmount, setCoinAmount] = useState('');
    const [apiCostPerCall, setApiCostPerCall] = useState(5);
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkCoinAmount, setBulkCoinAmount] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('all'); // all or single
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        totalCoins: 0
    });

    useEffect(() => {
        loadUsers();
        loadStats();
        loadApiCost();
    }, []);

    const loadUsers = async () => {
        try {
            const snapshot = await window.firebaseDB.collection('users').get();
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const snapshot = await window.firebaseDB.collection('users').get();
            let totalCoins = 0;
            let activeUsers = 0;
            let suspendedUsers = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                totalCoins += data.balance || 0;
                if (data.status === 'active') activeUsers++;
                if (data.status === 'suspended') suspendedUsers++;
            });

            setStats({
                totalUsers: snapshot.size,
                activeUsers,
                suspendedUsers,
                totalCoins
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadApiCost = async () => {
        try {
            const doc = await window.firebaseDB.collection('settings').doc('api_cost').get();
            if (doc.exists) {
                setApiCostPerCall(doc.data().costPerCall || 5);
            }
        } catch (error) {
            console.error('Error loading API cost:', error);
        }
    };

    const updateApiCost = async () => {
        try {
            await window.firebaseDB.collection('settings').doc('api_cost').set({
                costPerCall: parseInt(apiCostPerCall),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('API cost updated successfully!');
            setShowApiCost(false);
        } catch (error) {
            console.error('Error updating API cost:', error);
            alert('Failed to update API cost!');
        }
    };

    const addCoins = async () => {
        if (!selectedUser || !coinAmount) return;

        try {
            const amount = parseInt(coinAmount);
            
            // Create notification for user to claim
            await window.firebaseDB.collection('users').doc(selectedUser.id).collection('notifications').add({
                type: 'coin_reward',
                title: 'Coin Reward!',
                message: `You have received ${amount} coins from admin. Click to claim!`,
                amount: amount,
                claimed: false,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`Coin reward notification sent to ${selectedUser.email}`);
            setShowAddCoins(false);
            setCoinAmount('');
        } catch (error) {
            console.error('Error adding coins:', error);
            alert('Failed to send coin reward!');
        }
    };

    const deductCoins = async () => {
        if (!selectedUser || !coinAmount) return;

        try {
            const amount = parseInt(coinAmount);
            if (amount > selectedUser.balance) {
                alert('Amount exceeds user balance!');
                return;
            }

            await window.firebaseDB.collection('users').doc(selectedUser.id).update({
                balance: firebase.firestore.FieldValue.increment(-amount)
            });

            await window.firebaseDB.collection('users').doc(selectedUser.id).collection('transactions').add({
                type: 'admin_deduct',
                amount: -amount,
                description: 'Admin deducted coins',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('users').doc(selectedUser.id).collection('notifications').add({
                type: 'info',
                title: 'Coins Deducted',
                message: `Admin deducted ${amount} coins from your account`,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`Successfully deducted ${amount} coins from ${selectedUser.email}`);
            setShowDeductCoins(false);
            setCoinAmount('');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error deducting coins:', error);
            alert('Failed to deduct coins!');
        }
    };

    const sendBulkCoins = async () => {
        if (!bulkCoinAmount) return;

        const amount = parseInt(bulkCoinAmount);
        if (confirm(`Send ${amount} coins to ALL ${users.length} users?`)) {
            try {
                const batch = window.firebaseDB.batch();

                users.forEach(user => {
                    const notifRef = window.firebaseDB.collection('users').doc(user.id).collection('notifications').doc();
                    batch.set(notifRef, {
                        type: 'coin_reward',
                        title: 'Bulk Coin Reward!',
                        message: `You have received ${amount} coins from admin. Click to claim!`,
                        amount: amount,
                        claimed: false,
                        read: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                await batch.commit();
                alert(`Coin rewards sent to all ${users.length} users!`);
                setShowBulkCoins(false);
                setBulkCoinAmount('');
            } catch (error) {
                console.error('Error sending bulk coins:', error);
                alert('Failed to send bulk coins!');
            }
        }
    };

    const sendNotification = async () => {
        if (!notificationTitle || !notificationMessage) {
            alert('Please fill all fields!');
            return;
        }

        try {
            if (notificationType === 'all') {
                const batch = window.firebaseDB.batch();

                users.forEach(user => {
                    const notifRef = window.firebaseDB.collection('users').doc(user.id).collection('notifications').doc();
                    batch.set(notifRef, {
                        type: 'announcement',
                        title: notificationTitle,
                        message: notificationMessage,
                        read: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                await batch.commit();
                alert(`Notification sent to all ${users.length} users!`);
            } else {
                await window.firebaseDB.collection('users').doc(selectedUser.id).collection('notifications').add({
                    type: 'announcement',
                    title: notificationTitle,
                    message: notificationMessage,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`Notification sent to ${selectedUser.email}!`);
            }

            setShowSendNotification(false);
            setNotificationTitle('');
            setNotificationMessage('');
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification!');
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        
        try {
            await window.firebaseDB.collection('users').doc(userId).update({
                status: newStatus
            });

            await window.firebaseDB.collection('users').doc(userId).collection('notifications').add({
                type: 'warning',
                title: newStatus === 'suspended' ? 'Account Suspended' : 'Account Activated',
                message: newStatus === 'suspended' 
                    ? 'Your account has been suspended by admin' 
                    : 'Your account has been activated',
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully!`);
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status!');
        }
    };

    const deleteUser = async (userId, userEmail) => {
        if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) return;

        try {
            await window.firebaseDB.collection('users').doc(userId).delete();
            alert('User deleted successfully!');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user!');
        }
    };

    const filteredUsers = users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl">Loading admin panel...</p>
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
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
                            <span className="text-xl font-bold">Admin Panel</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={() => setShowBulkCoins(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm">
                                Send Bulk Coins
                            </button>
                            <button onClick={() => { setNotificationType('all'); setShowSendNotification(true); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm">
                                Send Notification
                            </button>
                            <button onClick={() => setShowApiCost(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">
                                API Cost
                            </button>
                            <button onClick={onLogout} className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                        <div className="text-slate-400 text-sm mb-2">Total Users</div>
                        <div className="text-3xl font-bold">{stats.totalUsers}</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-green-800 p-6">
                        <div className="text-slate-400 text-sm mb-2">Active Users</div>
                        <div className="text-3xl font-bold text-green-400">{stats.activeUsers}</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-red-800 p-6">
                        <div className="text-slate-400 text-sm mb-2">Suspended</div>
                        <div className="text-3xl font-bold text-red-400">{stats.suspendedUsers}</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-yellow-800 p-6">
                        <div className="text-slate-400 text-sm mb-2">Total Coins</div>
                        <div className="text-3xl font-bold text-yellow-400">{stats.totalCoins}</div>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">User Management</h2>
                        <input 
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-4 py-2 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left p-4 text-slate-400">User</th>
                                    <th className="text-left p-4 text-slate-400">Email</th>
                                    <th className="text-center p-4 text-slate-400">Balance</th>
                                    <th className="text-center p-4 text-slate-400">Status</th>
                                    <th className="text-center p-4 text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-4">
                                            <div className="font-semibold">{user.name || 'N/A'}</div>
                                            <div className="text-slate-400 text-xs">{user.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="p-4">{user.email}</td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-yellow-400">{user.balance || 0}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                user.status === 'active' 
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            }`}>
                                                {user.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setShowAddCoins(true); }}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                                    title="Add Coins"
                                                >
                                                    💰
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setShowDeductCoins(true); }}
                                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
                                                    title="Deduct Coins"
                                                >
                                                    ➖
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setNotificationType('single'); setShowSendNotification(true); }}
                                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                                                    title="Send Notification"
                                                >
                                                    🔔
                                                </button>
                                                <button 
                                                    onClick={() => toggleUserStatus(user.id, user.status)}
                                                    className={`px-3 py-1 rounded text-xs ${
                                                        user.status === 'active'
                                                            ? 'bg-red-600 hover:bg-red-700'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                    }`}
                                                    title={user.status === 'active' ? 'Suspend' : 'Activate'}
                                                >
                                                    {user.status === 'active' ? '🚫' : '✓'}
                                                </button>
                                                <button 
                                                    onClick={() => deleteUser(user.id, user.email)}
                                                    className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-xs"
                                                    title="Delete User"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showAddCoins && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddCoins(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Send Coin Reward</h2>
                        <p className="text-slate-400 mb-4">User: {selectedUser?.email}</p>
                        <input 
                            type="number"
                            placeholder="Amount"
                            value={coinAmount}
                            onChange={(e) => setCoinAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg mb-4 outline-none"
                        />
                        <p className="text-slate-400 text-sm mb-4">User will receive a notification to claim coins</p>
                        <div className="flex space-x-3">
                            <button onClick={addCoins} className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg">Send Reward</button>
                            <button onClick={() => setShowAddCoins(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeductCoins && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowDeductCoins(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Deduct Coins</h2>
                        <p className="text-slate-400 mb-2">User: {selectedUser?.email}</p>
                        <p className="text-slate-400 mb-4">Current Balance: {selectedUser?.balance}</p>
                        <input 
                            type="number"
                            placeholder="Amount"
                            value={coinAmount}
                            onChange={(e) => setCoinAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg mb-4 outline-none"
                        />
                        <div className="flex space-x-3">
                            <button onClick={deductCoins} className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg">Deduct</button>
                            <button onClick={() => setShowDeductCoins(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showBulkCoins && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowBulkCoins(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Send Bulk Coins</h2>
                        <p className="text-slate-400 mb-4">Send coins to all {users.length} registered users</p>
                        <input 
                            type="number"
                            placeholder="Amount per user"
                            value={bulkCoinAmount}
                            onChange={(e) => setBulkCoinAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg mb-4 outline-none"
                        />
                        <p className="text-slate-400 text-sm mb-4">All users will receive a notification to claim coins</p>
                        <div className="flex space-x-3">
                            <button onClick={sendBulkCoins} className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg">Send to All</button>
                            <button onClick={() => setShowBulkCoins(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showSendNotification && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowSendNotification(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">Send Notification</h2>
                        {notificationType === 'single' && (
                            <p className="text-slate-400 mb-4">To: {selectedUser?.email}</p>
                        )}
                        {notificationType === 'all' && (
                            <p className="text-slate-400 mb-4">To: All {users.length} users</p>
                        )}
                        <input 
                            type="text"
                            placeholder="Title"
                            value={notificationTitle}
                            onChange={(e) => setNotificationTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg mb-4 outline-none"
                        />
                        <textarea 
                            placeholder="Message"
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg mb-4 outline-none resize-none"
                            rows="4"
                        />
                        <div className="flex space-x-3">
                            <button onClick={sendNotification} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg">Send</button>
                            <button onClick={() => setShowSendNotification(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showApiCost && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowApiCost(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-4">API Cost Settings</h2>
                        <p className="text-slate-400 mb-4">Set the cost per API call (in coins)</p>
                        <input 
                            type="number"
                            placeholder="Cost per call"
                            value={apiCostPerCall}
                            onChange={(e) => setApiCostPerCall(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg mb-4 outline-none"
                        />
                        <div className="flex space-x-3">
                            <button onClick={updateApiCost} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">Update</button>
                            <button onClick={() => setShowApiCost(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
