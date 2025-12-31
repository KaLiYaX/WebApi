// FILE: src/AdminApp.jsx
// Admin App Main Controller - UPDATED WITH EMAIL AUTH

const { useState, useEffect } = React;

// ✅ ADMIN EMAIL - මෙතන ඔබේ admin email දාන්න
const ADMIN_EMAIL = 'kaliya.x.git@gmail.com';

function AdminApp() {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [adminEmail, setAdminEmail] = useState(null);

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
        
        // Listen to Firebase auth state changes
        const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
            console.log('🔐 Auth state changed:', user ? user.email : 'No user');
            
            if (user) {
                console.log('👤 User detected:', user.email);
                
                // ✅ CRITICAL CHECK: Only allow ADMIN_EMAIL
                if (user.email === ADMIN_EMAIL) {
                    console.log('✅ ADMIN ACCESS GRANTED:', user.email);
                    sessionStorage.setItem('kaliyax_admin_session', 'true');
                    sessionStorage.setItem('kaliyax_admin_email', user.email);
                    setIsAdminLoggedIn(true);
                    setAdminEmail(user.email);
                } else {
                    console.log('❌ ACCESS DENIED - Wrong email:', user.email);
                    
                    // Sign out unauthorized user
                    window.firebaseAuth.signOut().then(() => {
                        console.log('🔓 Unauthorized user signed out');
                    });
                    
                    sessionStorage.removeItem('kaliyax_admin_session');
                    sessionStorage.removeItem('kaliyax_admin_email');
                    
                    setIsAdminLoggedIn(false);
                    setAdminEmail(null);
                    
                    alert(`🚫 ACCESS DENIED!\n\nOnly ${ADMIN_EMAIL} can access admin panel.\n\nYou tried: ${user.email}`);
                }
            } else {
                console.log('👤 No user signed in');
                sessionStorage.removeItem('kaliyax_admin_session');
                sessionStorage.removeItem('kaliyax_admin_email');
                setIsAdminLoggedIn(false);
                setAdminEmail(null);
            }
            
            setLoading(false);
        });

        return () => {
            console.log('🧹 Cleaning up auth listener');
            unsubscribe();
        };
    }, []);

    const handleAdminLogin = (email) => {
        console.log('✅ Admin login successful:', email);
        
        if (email === ADMIN_EMAIL) {
            sessionStorage.setItem('kaliyax_admin_session', 'true');
            sessionStorage.setItem('kaliyax_admin_email', email);
            setIsAdminLoggedIn(true);
            setAdminEmail(email);
        } else {
            console.error('❌ Login attempted with wrong email:', email);
            handleAdminLogout();
        }
    };

    const handleAdminLogout = async () => {
        console.log('🔓 Admin logging out');
        try {
            await window.firebaseAuth.signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
        sessionStorage.removeItem('kaliyax_admin_session');
        sessionStorage.removeItem('kaliyax_admin_email');
        setIsAdminLoggedIn(false);
        setAdminEmail(null);
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
        adminEmail, 
        expectedEmail: ADMIN_EMAIL 
    });

    return (isAdminLoggedIn && adminEmail === ADMIN_EMAIL) ? (
        <AdminPanel onLogout={handleAdminLogout} adminEmail={adminEmail} />
    ) : (
        <AdminLogin onLogin={handleAdminLogin} />
    );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('admin-root'));
root.render(<AdminApp />);

console.log('✅ AdminApp rendered');
