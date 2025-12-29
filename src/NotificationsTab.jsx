// FILE: src/NotificationsTab.jsx
// Notifications Tab Component - Complete with Claim System

function NotificationsTab({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, rewards
    const [claiming, setClaiming] = useState(null);

    useEffect(() => {
        if (user) {
            loadNotifications();
            
            // Real-time listener
            const unsubscribe = window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .orderBy('timestamp', 'desc')
                .onSnapshot((snapshot) => {
                    const notifs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp?.toDate()
                    }));
                    setNotifications(notifs);
                    setLoading(false);
                });

            return () => unsubscribe();
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const snapshot = await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .orderBy('timestamp', 'desc')
                .get();

            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            setNotifications(notifs);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notificationId)
                .update({ read: true });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const claimCoins = async (notification) => {
        if (notification.claimed || !notification.amount || notification.amount <= 0) {
            return;
        }

        setClaiming(notification.id);

        try {
            // Update user balance
            await window.firebaseDB.collection('users').doc(user.uid).update({
                balance: firebase.firestore.FieldValue.increment(notification.amount)
            });

            // Add transaction record
            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'admin_credit',
                amount: notification.amount,
                description: notification.title || 'Claimed coin reward',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update notification as claimed
            await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notification.id)
                .update({ 
                    claimed: true,
                    read: true
                });

            alert(`✅ Successfully claimed ${notification.amount} coins!`);
        } catch (error) {
            console.error('Error claiming coins:', error);
            alert('❌ Failed to claim coins. Please try again.');
        } finally {
            setClaiming(null);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!confirm('Delete this notification?')) return;

        try {
            await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notificationId)
                .delete();
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('❌ Failed to delete notification');
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = window.firebaseDB.batch();
            const unreadNotifs = notifications.filter(n => !n.read);

            unreadNotifs.forEach(notif => {
                const ref = window.firebaseDB
                    .collection('users')
                    .doc(user.uid)
                    .collection('notifications')
                    .doc(notif.id);
                batch.update(ref, { read: true });
            });

            await batch.commit();
            alert('✅ All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            alert('❌ Failed to mark all as read');
        }
    };

    const deleteAll = async () => {
        if (!confirm('Delete all notifications? This cannot be undone.')) return;

        try {
            const batch = window.firebaseDB.batch();

            notifications.forEach(notif => {
                const ref = window.firebaseDB
                    .collection('users')
                    .doc(user.uid)
                    .collection('notifications')
                    .doc(notif.id);
                batch.delete(ref);
            });

            await batch.commit();
            alert('✅ All notifications deleted');
        } catch (error) {
            console.error('Error deleting all:', error);
            alert('❌ Failed to delete notifications');
        }
    };

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'coin_reward':
                return '💰';
            case 'announcement':
                return '📢';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch(type) {
            case 'coin_reward':
                return 'border-yellow-500 bg-yellow-500/10';
            case 'announcement':
                return 'border-blue-500 bg-blue-500/10';
            case 'warning':
                return 'border-orange-500 bg-orange-500/10';
            case 'info':
                return 'border-purple-500 bg-purple-500/10';
            case 'success':
                return 'border-green-500 bg-green-500/10';
            case 'error':
                return 'border-red-500 bg-red-500/10';
            default:
                return 'border-slate-500 bg-slate-500/10';
        }
    };

    const formatTime = (date) => {
        if (!date) return 'Just now';
        
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread') return !notif.read;
        if (filter === 'rewards') return notif.type === 'coin_reward';
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const rewardCount = notifications.filter(n => n.type === 'coin_reward' && !n.claimed).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Notifications</h1>
                <p className="text-slate-400">Stay updated with your account activities</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span className="text-xs text-slate-400">Total</span>
                    </div>
                    <div className="text-3xl font-bold">{notifications.length}</div>
                    <p className="text-slate-400 text-sm mt-1">All notifications</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-slate-400">Unread</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-400">{unreadCount}</div>
                    <p className="text-slate-400 text-sm mt-1">New notifications</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs text-slate-400">Rewards</span>
                    </div>
                    <div className="text-3xl font-bold text-yellow-400">{rewardCount}</div>
                    <p className="text-slate-400 text-sm mt-1">Unclaimed rewards</p>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                filter === 'all' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button 
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                filter === 'unread' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button 
                            onClick={() => setFilter('rewards')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                filter === 'rewards' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            Rewards ({rewardCount})
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-sm"
                            >
                                Mark All Read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button 
                                onClick={deleteAll}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm"
                            >
                                Delete All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-12 text-center">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="text-xl font-bold mb-2">No Notifications</h3>
                    <p className="text-slate-400">
                        {filter === 'unread' && 'No unread notifications'}
                        {filter === 'rewards' && 'No reward notifications'}
                        {filter === 'all' && 'You have no notifications yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notif) => (
                        <div 
                            key={notif.id}
                            className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border p-6 transition-all hover:shadow-lg ${
                                getNotificationColor(notif.type)
                            } ${!notif.read ? 'ring-2 ring-purple-500/30' : ''}`}
                        >
                            <div className="flex items-start space-x-4">
                                <div className="text-4xl">{getNotificationIcon(notif.type)}</div>
                                
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold">{notif.title}</h3>
                                            <p className="text-slate-400 text-sm mt-1">{notif.message}</p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-3 h-3 bg-purple-500 rounded-full ml-4"></div>
                                        )}
                                    </div>

                                    {/* Claim Button for Rewards */}
                                    {notif.type === 'coin_reward' && !notif.claimed && notif.amount > 0 && (
                                        <button 
                                            onClick={() => claimCoins(notif)}
                                            disabled={claiming === notif.id}
                                            className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            {claiming === notif.id ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Claiming...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                                                    </svg>
                                                    <span>Claim {notif.amount} Coins</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {notif.type === 'coin_reward' && notif.claimed && (
                                        <div className="mt-4 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 font-semibold text-center">
                                            ✅ Claimed
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-slate-500 text-sm">{formatTime(notif.timestamp)}</span>
                                        <div className="flex items-center space-x-3">
                                            {!notif.read && (
                                                <button 
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => deleteNotification(notif.id)}
                                                className="text-red-400 hover:text-red-300 text-sm font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
