// FILE: src/AdminApp.jsx
// Admin App Main Controller - UPDATED WITH HARDCODED AUTH

const { useState, useEffect } = React;

// ✅ ADMIN USERNAME
const ADMIN_USERNAME = 'Kaliyax';

function AdminApp() {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [adminUsername, setAdminUsername] = useState(null);

    useEffect(() => {
        console.log('🔍 AdminApp mounted - Checking authentication...');
        
        // ✅ CRITICAL: Verify we're on admin page
        const isAdminPage = window.location.pathname.includes('admin.html') || 
                           window.location.pathname === '/admin' ||
                           window.location.pathname === '/admin.html';
        
        if (!isAdminPage) {
            console.log('❌ Not admin page, redirecting...');
            window.location.href = '/admin.html';
            return;
        }
        
        // Check session storage for existing login
        const session = sessionStorage.getItem('kaliyax_admin_session');
        const username = sessionStorage.getItem('kaliyax_admin_username');
        
        if (session === 'true' && username === ADMIN_USERNAME) {
            console.log('✅ Found valid admin session:', username);
            setIsAdminLoggedIn(true);
            setAdminUsername(username);
        } else {
            console.log('👤 No valid admin session found');
            setIsAdminLoggedIn(false);
            setAdminUsername(null);
        }
        
        setLoading(false);
    }, []);

    const handleAdminLogin = (username) => {
        console.log('✅ Admin login successful:', username);
        
        if (username === ADMIN_USERNAME) {
            sessionStorage.setItem('kaliyax_admin_session', 'true');
            sessionStorage.setItem('kaliyax_admin_username', username);
            setIsAdminLoggedIn(true);
            setAdminUsername(username);
        } else {
            console.error('❌ Login attempted with wrong username:', username);
            handleAdminLogout();
        }
    };

    const handleAdminLogout = () => {
        console.log('🔓 Admin logging out');
        sessionStorage.removeItem('kaliyax_admin_session');
        sessionStorage.removeItem('kaliyax_admin_username');
        setIsAdminLoggedIn(false);
        setAdminUsername(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    console.log('🎨 Rendering:', { 
        isAdminLoggedIn, 
        adminUsername, 
        expectedUsername: ADMIN_USERNAME 
    });

    return (isAdminLoggedIn && adminUsername === ADMIN_USERNAME) ? (
        <AdminPanel onLogout={handleAdminLogout} adminEmail={adminUsername} />
    ) : (
        <AdminLogin onLogin={handleAdminLogin} />
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('admin-root'));
root.render(<AdminApp />);

console.log('✅ AdminApp rendered');
