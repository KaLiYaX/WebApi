// FILE: src/UserProfile.jsx
// User Profile Component

function UserProfile({ user, userData, onClose, onUpdate }) {
    const [activeSection, setActiveSection] = useState('profile');
    const [name, setName] = useState(userData?.name || '');
    const [bio, setBio] = useState(userData?.bio || '');
    const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const generateProfilePicture = (name) => {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="${color}"/>
                <text x="50%" y="50%" font-size="80" font-family="Arial" font-weight="bold" 
                      fill="white" text-anchor="middle" dy=".35em">${initials}</text>
            </svg>
        `)}`;
    };

    useEffect(() => {
        if (!profilePicture && name) {
            setProfilePicture(generateProfilePicture(name));
        }
    }, [name]);

    const updateProfile = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await window.firebaseDB.collection('users').doc(user.uid).update({
                name: name,
                bio: bio,
                profilePicture: profilePicture
            });

            setSuccess('Profile updated successfully!');
            onUpdate();
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
            await user.reauthenticateWithCredential(credential);
            
            await user.updatePassword(newPassword);
            setSuccess('Password changed successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        } catch (err) {
            if (err.code === 'auth/wrong-password') {
                setError('Current password is incorrect');
            } else {
                setError('Failed to change password');
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteAccount = async () => {
        if (!deletePassword) {
            setError('Please enter your password');
            return;
        }

        if (!confirm('Are you sure? This action cannot be undone!')) return;

        setLoading(true);
        setError('');

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(user.email, deletePassword);
            await user.reauthenticateWithCredential(credential);

            await window.firebaseDB.collection('users').doc(user.uid).delete();
            await user.delete();

            alert('Account deleted successfully');
        } catch (err) {
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect password');
            } else {
                setError('Failed to delete account');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">User Profile</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="border-b border-slate-800 px-6">
                    <div className="flex space-x-4 overflow-x-auto">
                        {['profile', 'security', 'delete'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveSection(tab)}
                                className={`px-4 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    activeSection === tab
                                        ? 'border-purple-500 text-purple-400'
                                        : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                            >
                                {tab === 'profile' && 'Profile'}
                                {tab === 'security' && 'Security'}
                                {tab === 'delete' && 'Delete Account'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    {activeSection === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center">
                                <img
                                    src={profilePicture || generateProfilePicture(name || 'User')}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full border-4 border-purple-500 mb-4"
                                />
                                <button
                                    onClick={() => setProfilePicture(generateProfilePicture(name || 'User'))}
                                    className="text-purple-400 hover:text-purple-300 text-sm"
                                >
                                    Regenerate Picture
                                </button>
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-sm mb-2">Bio</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows="4"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <button
                                onClick={updateProfile}
                                disabled={loading}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span>Updating...</span>
                                    </>
                                ) : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-8">
                            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-bold mb-4">Change Password</h3>
                                <div className="space-y-4">
                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"
                                    />
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg outline-none"
                                    />
                                    <button
                                        onClick={changePassword}
                                        disabled={loading}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                <span>Changing...</span>
                                            </>
                                        ) : 'Change Password'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'delete' && (
                        <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
                            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
                            <p className="text-slate-400 mb-6">
                                This action cannot be undone. All your data will be permanently deleted.
                            </p>
                            <input
                                type="password"
                                placeholder="Enter your password to confirm"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-red-500/50 rounded-lg outline-none mb-4"
                            />
                            <button
                                onClick={deleteAccount}
                                disabled={loading}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        <span>Deleting...</span>
                                    </>
                                ) : 'Delete My Account'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
