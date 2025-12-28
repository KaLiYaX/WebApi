const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdminRoute, setIsAdminRoute] = useState(false);
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

    useEffect(() => {
        // Check if admin route
        const path = window.location.pathname;
        if (path === '/admin' || path === '/admin/') {
            setIsAdminRoute(true);
            setLoading(false);
            return;
        }

        // Check authentication state for regular users
        const unsubscribe = window.firebaseAuth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdminLogin = () => {
        setIsAdminLoggedIn(true);
    };

    const handleAdminLogout = () => {
        setIsAdminLoggedIn(false);
        window.location.href = '/';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl">Loading...</p>
                </div>
            </div>
        );
    }

    // Admin Route
    if (isAdminRoute) {
        return isAdminLoggedIn ? (
            <AdminPanel onLogout={handleAdminLogout} />
        ) : (
            <AdminLogin onLogin={handleAdminLogin} />
        );
    }

    // User Route
    return (
        <div>
            {user ? <Dashboard user={user} /> : <AuthPage />}
        </div>
    );
}

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
