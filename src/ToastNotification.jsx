// FILE: src/ToastNotification.jsx
// Toast Notification System Component

const { useState, useEffect } = React;

function ToastNotification() {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Global function to show notifications
        window.showToast = (message, type = 'success', duration = 3000) => {
            const id = Date.now() + Math.random();
            const newNotif = { id, message, type };
            
            setNotifications(prev => [...prev, newNotif]);
            
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, duration);
        };
    }, []);

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-md">
            {notifications.map(notif => (
                <div
                    key={notif.id}
                    className={`p-4 rounded-xl shadow-2xl border backdrop-blur-xl animate-fade-in transform transition-all ${
                        notif.type === 'success'
                            ? 'bg-green-500/10 border-green-500/50'
                            : notif.type === 'error'
                            ? 'bg-red-500/10 border-red-500/50'
                            : notif.type === 'warning'
                            ? 'bg-yellow-500/10 border-yellow-500/50'
                            : 'bg-blue-500/10 border-blue-500/50'
                    }`}
                >
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            {notif.type === 'success' && (
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            {notif.type === 'error' && (
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            {notif.type === 'warning' && (
                                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                            {notif.type === 'info' && (
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className={`font-semibold text-sm ${
                                notif.type === 'success' ? 'text-green-300' :
                                notif.type === 'error' ? 'text-red-300' :
                                notif.type === 'warning' ? 'text-yellow-300' :
                                'text-blue-300'
                            }`}>
                                {notif.message}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
