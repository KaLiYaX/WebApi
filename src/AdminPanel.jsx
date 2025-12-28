function AdminPanel({ onLogout }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAddCoins, setShowAddCoins] = useState(false);
    const [showDeductCoins, setShowDeductCoins] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showBulkCoins, setShowBulkCoins] = useState(false);
    const [showSendNotification, setShowSendNotification] = useState(false);
    const [coinAmount, setCoinAmount] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkCoinAmount, setBulkCoinAmount] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('all');
    const [settings, setSettings] = useState({
        apiCostPerCall: 5,
        referralBonus: 40,
        welcomeBonus: 100
    });
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        totalCoins: 0
    });

    useEffect(() => {
        loadUsers();
        loadStats();
        loadSettings();
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

    const loadSettings = async () => {
        try {
            const apiCostDoc = await window.firebaseDB.collection('settings').doc('api_cost').get();
            const referralDoc = await window.firebaseDB.collection('settings').doc('referral_bonus').get();
            const welcomeDoc = await window.firebaseDB.collection('settings').doc('welcome_bonus').get();

            setSettings({
                apiCostPerCall: apiCostDoc.exists ? apiCostDoc.data().costPerCall : 5,
                referralBonus: referralDoc.exists ? referralDoc.data().bonus : 40,
                welcomeBonus: welcomeDoc.exists ? welcomeDoc.data().bonus : 100
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const updateSettings = async () => {
        try {
            await window.firebaseDB.collection('settings').doc('api_cost').set({
                costPerCall: parseInt(settings.apiCostPerCall),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('settings').doc('referral_bonus').set({
                bonus: parseInt(settings.referralBonus),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB.collection('settings').doc('welcome_bonus').set({
                bonus: parseInt(settings.welcomeBonus),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Settings updated successfully! ✅');
            setShowSettings(false);
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings! ❌');
        }
    };

    const addCoins = async () => {
        if (!selectedUser || !coinAmount) return;

        try {
            const amount = parseInt(coinAmount);
            
            await window.firebaseDB.collection('users').doc(selectedUser.id).collection('notifications').add({
                type: 'coin_reward',
                title: 'Coin Reward! 🎉',
                message: `You have received ${amount} coins from admin. Click to claim!`,
                amount: amount,
                claimed: false,
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`✅ Coin reward notification sent to ${selectedUser.email}`);
            setShowAddCoins(false);
            setCoinAmount('');
        } catch (error) {
            console.error('Error adding coins:', error);
            alert('❌ Failed to send coin reward!');
        }
    };

    const deductCoins = async () => {
        if (!selectedUser || !coinAmount) return;

        try {
            const amount = parseInt(coinAmount);
            if (amount > selectedUser.balance) {
                alert('❌ Amount exceeds user balance!');
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

            alert(`✅ Successfully deducted ${amount} coins from ${selectedUser.email}`);
            setShowDeductCoins(false);
            setCoinAmount('');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error deducting coins:', error);
            alert('❌ Failed to deduct coins!');
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
                        title: 'Bulk Coin Reward! 💰',
                        message: `You have received ${amount} coins from admin. Click to claim!`,
                        amount: amount,
                        claimed: false,
                        read: false,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });

                await batch.commit();
                alert(`✅ Coin rewards sent to all ${users.length} users!`);
                setShowBulkCoins(false);
                setBulkCoinAmount('');
            } catch (error) {
                console.error('Error sending bulk coins:', error);
                alert('❌ Failed to send bulk coins!');
            }
        }
    };

    const sendNotification = async () => {
        if (!notificationTitle || !notificationMessage) {
            alert('❌ Please fill all fields!');
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
                alert(`✅ Notification sent to all ${users.length} users!`);
            } else {
                await window.firebaseDB.collection('users').doc(selectedUser.id).collection('notifications').add({
                    type: 'announcement',
                    title: notificationTitle,
                    message: notificationMessage,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`✅ Notification sent to ${selectedUser.email}!`);
            }

            setShowSendNotification(false);
            setNotificationTitle('');
            setNotificationMessage('');
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('❌ Failed to send notification!');
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
                title: newStatus === 'suspended' ? 'Account Suspended ⚠️' : 'Account Activated ✅',
                message: newStatus === 'suspended' 
                    ? 'Your account has been suspended by admin' 
                    : 'Your account has been activated',
                read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`✅ User ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully!`);
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('❌ Failed to update user status!');
        }
    };

    const deleteUser = async (userId, userEmail) => {
        if (!confirm(`⚠️ Are you sure you want to delete user: ${userEmail}?`)) return;

        try {
            await window.firebaseDB.collection('users').doc(userId).delete();
            alert('✅ User deleted successfully!');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('❌ Failed to delete user!');
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

            {/* Navigation */}
            <nav className="relative z-10 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center font-bold text-xl">A</div>
                            <span className="text-xl font-bold">Admin Panel</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <button onClick={() => setShowBulkCoins(true)} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-xs sm:text-sm">
                                💰 Bulk Coins
                            </button>
                            <button onClick={() => { setNotificationType('all'); setShowSendNotification(true); }} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-xs sm:text-sm">
                                📢 Notification
                            </button>
                            <button onClick={() => setShowSettings(true)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs sm:text-sm">
                                ⚙️ Settings
                            </button>
                            <button onClick={onLogout} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs sm:text-sm">
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-8">Admin Dashboard</h1>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-4 sm:p-6">
                        <div className="text-slate-400 text-xs sm:text-sm mb-2">Total Users</div>
                        <div className="text-2xl sm:text-3xl font-bold">{stats.totalUsers}</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-green-800 p-4 sm:p-6">
                        <div className="text-slate-400 text-xs sm:text-sm mb-2">Active</div>
                        <div className="text-2xl sm:text-3xl font-bold text-green-400">{stats.activeUsers}</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-red-800 p-4 sm:p-6">
                        <div className="text-slate-400 text-xs sm:text-sm mb-2">Suspended</div>
                        <div className="text-2xl sm:text-3xl font-bold text-red-400">{stats.suspendedUsers}</div>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-yellow-800 p-4 sm:p-6">
                        <div className="text-slate-400 text-xs sm:text-sm mb-2">Total Coins</div>
                        <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{stats.totalCoins}</div>
                    </div>
                </div>

                {/* User Table */}
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold">User Management</h2>
                        <input 
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left p-2 sm:p-4 text-slate-400">User</th>
                                    <th className="text-left p-2 sm:p-4 text-slate-400 hidden sm:table-cell">Email</th>
                                    <th className="text-center p-2 sm:p-4 text-slate-400">Balance</th>
                                    <th className="text-center p-2 sm:p-4 text-slate-400 hidden md:table-cell">Status</th>
                                    <th className="text-center p-2 sm:p-4 text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                        <td className="p-2 sm:p-4">
                                            <div className="font-semibold text-xs sm:text-sm">{user.name || 'N/A'}</div>
                                            <div className="text-slate-400 text-xs sm:hidden">{user.email}</div>
                                        </td>
                                        <td className="p-2 sm:p-4 hidden sm:table-cell text-xs sm:text-sm">{user.email}</td>
                                        <td className="p-2 sm:p-4 text-center">
                                            <span className="font-bold text-yellow-400 text-xs sm:text-sm">{user.balance || 0}</span>
                                        </td>
                                        <td className="p-2 sm:p-4 text-center hidden md:table-cell">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                user.status === 'active' 
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                            }`}>
                                                {user.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-2 sm:p-4">
                                            <div className="flex items-center justify-center space-x-1">
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setShowAddCoins(true); }}
                                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                                    title="Add Coins"
                                                >
                                                    💰
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setShowDeductCoins(true); }}
                                                    className="px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs"
                                                    title="Deduct Coins"
                                                >
                                                    ➖
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setNotificationType('single'); setShowSendNotification(true); }}
                                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs hidden sm:inline"
                                                    title="Notification"
                                                >
                                                    🔔
                                                </button>
                                                <button 
                                                    onClick={() => toggleUserStatus(user.id, user.status)}
                                                    className={`px-2 py-1 rounded text-xs ${
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
                                                    className="px-2 py-1 bg-red-700 hover:bg-red-800 rounded text-xs hidden md:inline"
                                                    title="Delete"
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

            {/* Modals - (continuing in next message due to length) */}
            
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowSettings(false)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl sm:text-2xl font-bold mb-6">⚙️ System Settings</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-2">API Cost Per Call (coins)</label>
                                <input 
                                    type="number"
                                    value={settings.apiCostPerCall}
                                    onChange={(e) => setSettings({...settings, apiCostPerCall: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Referral Bonus (coins)</label>
                                <input 
                                    type="number"
                                    value={settings.referralBonus}
                                    onChange={(e) => setSettings({...settings, referralBonus: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Welcome Bonus (coins)</label>
                                <input 
                                    type="number"
                                    value={settings.welcomeBonus}
                                    onChange={(e) => setSettings({...settings, welcomeBonus: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button onClick={updateSettings} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg">Save Changes</button>
                            <button onClick={() => setShowSettings(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add remaining modals similarly with responsive design */}
        </div>
    );
}
