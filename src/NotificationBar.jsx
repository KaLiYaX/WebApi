// FILE: src/NotificationBar.jsx
// Notification Bar Component

function NotificationBar({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadNotifications();
            
            const unsubscribe = window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .orderBy('timestamp', 'desc')
                .limit(20)
                .onSnapshot((snapshot) => {
                    const notifs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp?.toDate()
                    }));
                    setNotifications(notifs);
                    
                    const unread = notifs.filter(n => !n.read).length;
                    setUnreadCount(unread);
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
                .limit(20)
                .get();

            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));

            setNotifications(notifs);
            const unread = notifs.filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error loading notifications:', error);
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
        if (notification.claimed) return;

        try {
            await window.firebaseDB.collection('users').doc(user.uid).update({
                balance: firebase.firestore.FieldValue.increment(notification.amount)
            });

            await window.firebaseDB.collection('users').doc(user.uid).collection('transactions').add({
                type: 'admin_credit',
                amount: notification.amount,
                description: 'Claimed coin reward from admin',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notification.id)
                .update({ 
                    claimed: true,
                    read: true
                });

            alert(`Successfully claimed ${notification.amount} coins!`);
        } catch (error) {
            console.error('Error claiming coins:', error);
            alert('Failed to claim coins!');
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await window.firebaseDB
                .collection('users')
                .doc(user.uid)
                .collection('notifications')
                .doc(notificationId)
                .delete();
        } catch (error) {
            console.error('Error deleting notification:', error);
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
        } catch (error) {
            console.error('Error marking all as read:', error);
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
            default:
                return '🔔';
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

    return (
        <div className="relative">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-[500px] overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900">
                        <h3 className="font-bold text-lg">Notifications</h3>
                        <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-400 hover:text-blue-300"
                                >
                                    Mark all read
                                </button>
                            )}
                            <button 
                                onClick={() => setShowNotifications(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[420px]">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    className={`p-4 border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${
                                        !notif.read ? 'bg-blue-500/5' : ''
                                    }`}
                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="text-2xl">{getNotificationIcon(notif.type)}</div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <h4 className="font-semibold text-sm">{notif.title}</h4>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm mt-1">{notif.message}</p>
                                            
                                            {notif.type === 'coin_reward' && !notif.claimed && notif.amount > 0 && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); claimCoins(notif); }}
                                                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors w-full"
                                                >
                                                    Claim {notif.amount} Coins
                                                </button>
                                            )}
                                            
                                            {notif.type === 'coin_reward' && notif.claimed && (
                                                <div className="mt-3 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 text-center">
                                                    Claimed
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-slate-500 text-xs">{formatTime(notif.timestamp)}</span>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                                    className="text-slate-500 hover:text-red-400 text-xs"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
