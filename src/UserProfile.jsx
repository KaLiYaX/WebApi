// FILE: src/UserProfile.jsx
// User Profile Component (Password Change & Delete Account REMOVED)

function UserProfile({ user, userData, onClose, onUpdate }) {
    const [name, setName] = useState(userData?.name || '');
    const [bio, setBio] = useState(userData?.bio || '');
    const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || '');
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

            setSuccess('✅ Profile updated successfully!');
            onUpdate();
        } catch (err) {
            console.error('Update error:', err);
            setError('❌ Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">User Profile</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
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

                    <div className="space-y-6">
                        <div className="flex flex-col items-center">
                            <img
                                src={profilePicture || generateProfilePicture(name || 'User')}
                                alt="Profile"
                                className="w-32 h-32 rounded-full border-4 border-purple-500 mb-4"
                            />
                            <button
                                onClick={() => setProfilePicture(generateProfilePicture(name || 'User'))}
                                className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                            >
                                🔄 Regenerate Picture
                            </button>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-2 font-semibold">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-2 font-semibold">Email (Read-only)</label>
                            <input
                                type="email"
                                value={userData?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-700 rounded-lg outline-none cursor-not-allowed opacity-60"
                            />
                            <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-2 font-semibold">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows="4"
                                placeholder="Tell us about yourself..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
                            />
                        </div>

                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
