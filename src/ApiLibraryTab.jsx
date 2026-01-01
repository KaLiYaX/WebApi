// FILE: src/ApiLibraryTab.jsx - COMPLETE FULL VERSION

function ApiLibraryTab() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [testParams, setTestParams] = useState({});
    const [testLoading, setTestLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [userData, setUserData] = useState(null);
    const [copiedResponse, setCopiedResponse] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = window.firebaseAuth.currentUser;
            if (user) {
                const doc = await window.firebaseDB.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    setUserData(doc.data());
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    // ✅ YOUR API BASE URL
    const API_BASE_URL = 'https://web-api-q7ey.vercel.app';

    const endpoints = [
        { 
            category: 'AI & ML', 
            icon: '🤖',
            apis: [
                { 
                    name: 'Perplexity AI Search', 
                    desc: 'Advanced AI-powered search engine', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/perplexity-search`,
                    method: 'POST',
                    featured: true,
                    params: { 
                        query: { 
                            type: 'text', 
                            label: 'Search Query', 
                            placeholder: 'What is quantum computing?', 
                            required: true 
                        }
                    }
                }
            ]
        },
        { 
            category: 'YouTube', 
            icon: '🎥',
            apis: [
                { 
                    name: 'YouTube Search', 
                    desc: 'Search YouTube videos', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/youtube/search`,
                    method: 'GET',
                    featured: true,
                    params: { 
                        q: { 
                            type: 'text', 
                            label: 'Search Query', 
                            placeholder: 'sajith premadasa speech', 
                            required: true 
                        }
                    }
                },
                { 
                    name: 'YouTube MP3 Download', 
                    desc: 'Download YouTube video as MP3 audio', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/youtube/mp3`,
                    method: 'GET',
                    featured: true,
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'YouTube URL', 
                            placeholder: 'https://www.youtube.com/watch?v=...', 
                            required: true 
                        },
                        quality: { 
                            type: 'select', 
                            label: 'Audio Quality', 
                            options: ['32', '64', '96', '128', '160', '192', '256', '320'], 
                            default: '128' 
                        }
                    }
                },
                { 
                    name: 'YouTube MP4 Download', 
                    desc: 'Download YouTube video as MP4', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/youtube/mp4`,
                    method: 'GET',
                    featured: true,
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'YouTube URL', 
                            placeholder: 'https://www.youtube.com/watch?v=...', 
                            required: true 
                        },
                        quality: { 
                            type: 'select', 
                            label: 'Video Quality', 
                            options: ['144', '240', '360', '480', '720', '1080', '1440'], 
                            default: '360' 
                        }
                    }
                },
                { 
                    name: 'YouTube Transcript', 
                    desc: 'Get video transcript with AI summary', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/youtube/transcript`,
                    method: 'GET',
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'YouTube URL', 
                            placeholder: 'https://www.youtube.com/watch?v=...', 
                            required: true 
                        }
                    }
                },
                { 
                    name: 'Play MP3', 
                    desc: 'Search and get MP3 downloads (Top 5)', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/youtube/playmp3`,
                    method: 'GET',
                    params: { 
                        q: { 
                            type: 'text', 
                            label: 'Search Query', 
                            placeholder: 'song name', 
                            required: true 
                        },
                        quality: { 
                            type: 'select', 
                            label: 'Quality', 
                            options: ['128', '192', '256', '320'], 
                            default: '128' 
                        }
                    }
                },
                { 
                    name: 'Play MP4', 
                    desc: 'Search and get MP4 downloads (Top 5)', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/youtube/playmp4`,
                    method: 'GET',
                    params: { 
                        q: { 
                            type: 'text', 
                            label: 'Search Query', 
                            placeholder: 'video name', 
                            required: true 
                        },
                        quality: { 
                            type: 'select', 
                            label: 'Quality', 
                            options: ['360', '480', '720'], 
                            default: '360' 
                        }
                    }
                }
            ]
        },
        { 
            category: 'Movies & Series', 
            icon: '🎬',
            apis: [
                { 
                    name: 'CineSubz Movie Search', 
                    desc: 'Search Sinhala subtitle movies', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/movie/cinesubz-search`,
                    method: 'GET',
                    featured: true,
                    params: { 
                        q: { 
                            type: 'text', 
                            label: 'Movie Name', 
                            placeholder: 'Avengers', 
                            required: true 
                        }
                    }
                },
                { 
                    name: 'CineSubz Movie Info', 
                    desc: 'Get detailed movie information', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/movie/cinesubz-info`,
                    method: 'GET',
                    featured: true,
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'Movie URL', 
                            placeholder: 'https://cinesubz.lk/movies/good-news-2025-sinhala-subtitles/', 
                            required: true 
                        }
                    }
                },
                { 
                    name: 'CineSubz TV Series Info', 
                    desc: 'Get TV series information', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/tv/cinesubz-info`,
                    method: 'GET',
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'TV Series URL', 
                            placeholder: 'https://cinesubz.lk/tvshows/the-price-of-confession-2025/', 
                            required: true 
                        }
                    }
                },
                { 
                    name: 'CineSubz Episode Info', 
                    desc: 'Get episode information', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/episode/cinesubz-info`,
                    method: 'GET',
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'Episode URL', 
                            placeholder: 'https://cinesubz.lk/episodes/the-price-of-confession-1x2/', 
                            required: true 
                        }
                    }
                },
                { 
                    name: 'CineSubz Download Links', 
                    desc: 'Get movie/episode download links', 
                    status: 'active', 
                    endpoint: `${API_BASE_URL}/api/movie/cinesubz-download`,
                    method: 'GET',
                    params: { 
                        url: { 
                            type: 'text', 
                            label: 'Download URL', 
                            placeholder: 'Enter the download URL from movie info', 
                            required: true 
                        }
                    }
                }
            ]
        }
    ];

    const categories = ['All', ...endpoints.map(e => e.category)];

    const filteredEndpoints = endpoints
        .map(cat => ({
            ...cat,
            apis: cat.apis.filter(api => 
                (selectedCategory === 'All' || cat.category === selectedCategory) &&
                (searchQuery === '' || 
                    api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    api.desc.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        }))
        .filter(cat => cat.apis.length > 0);

    const handleTestApi = async () => {
        if (!userData || !userData.apiKey) {
            alert('❌ API Key not found! Please check your profile.');
            return;
        }

        setTestLoading(true);
        setTestResult(null);

        try {
            const url = new URL(selectedEndpoint.endpoint);
            const headers = { 'x-api-key': userData.apiKey };

            if (selectedEndpoint.method === 'GET') {
                Object.keys(testParams).forEach(key => {
                    if (testParams[key]) {
                        url.searchParams.append(key, testParams[key]);
                    }
                });

                const response = await fetch(url.toString(), { headers });
                const data = await response.json();
                
                // ✅ Extract only "data" field from response
                const cleanData = data?.data || data;
                
                setTestResult({ status: response.status, data: cleanData, url: url.toString() });
            } else {
                const response = await fetch(url.toString(), {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify(testParams)
                });
                const data = await response.json();
                
                // ✅ Extract only "data" field from response
                const cleanData = data?.data || data;
                
                setTestResult({ status: response.status, data: cleanData, url: url.toString() });
            }

            await loadUserData();

        } catch (error) {
            setTestResult({ 
                status: 0, 
                data: { success: false, error: error.message },
                url: selectedEndpoint.endpoint
            });
        } finally {
            setTestLoading(false);
        }
    };

    const copyResponse = () => {
        if (!testResult) return;
        
        // ✅ Copy only the clean data
        const responseText = JSON.stringify(testResult.data, null, 2);
        navigator.clipboard.writeText(responseText);
        setCopiedResponse(true);
        setTimeout(() => setCopiedResponse(false), 2000);
    };

    const openResponseUrl = () => {
        if (!testResult || !testResult.url) return;
        
        // ✅ Add user API key to URL
        const url = new URL(testResult.url);
        
        // Check if URL already has x-api-key as a query parameter
        if (!url.searchParams.has('apikey') && !url.searchParams.has('x-api-key')) {
            // Add as header-style (most common)
            const urlWithKey = `${testResult.url}${testResult.url.includes('?') ? '&' : '?'}x-api-key=${userData.apiKey}`;
            window.open(urlWithKey, '_blank');
        } else {
            window.open(testResult.url, '_blank');
        }
    };

    const extractDownloadUrl = (data) => {
        // ✅ Extract download URL from cleaned data
        if (data?.download?.url) return data.download.url;
        if (data?.results && Array.isArray(data.results) && data.results[0]?.download?.url) {
            return data.results[0].download.url;
        }
        // Check for nested data field (in case of partial cleaning)
        if (data?.data?.download?.url) return data.data.download.url;
        if (data?.data?.results && Array.isArray(data.data.results) && data.data.results[0]?.download?.url) {
            return data.data.results[0].download.url;
        }
        return null;
    };

    return (
        <div className="flex gap-6">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-4 sticky top-24 h-fit hidden lg:block`}>
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-full mb-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <svg className={`w-6 h-6 mx-auto transition-transform ${!sidebarOpen && 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>

                {sidebarOpen && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-400 mb-3 px-2">Categories</h3>
                        {categories.map(cat => {
                            const categoryData = endpoints.find(e => e.category === cat);
                            const apiCount = cat === 'All' 
                                ? endpoints.reduce((sum, e) => sum + e.apis.length, 0)
                                : categoryData?.apis.length || 0;
                            
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                                        selectedCategory === cat 
                                            ? 'bg-purple-600 text-white' 
                                            : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        {categoryData?.icon && <span>{categoryData.icon}</span>}
                                        <span className="text-sm font-semibold">{cat}</span>
                                    </div>
                                    <span className="text-xs bg-slate-950/50 px-2 py-0.5 rounded-full">
                                        {apiCount}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">API Library</h1>
                    <p className="text-slate-400">Explore and test APIs with your API key</p>
                </div>

                {/* Search Bar */}
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 mb-8">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            type="text"
                            placeholder="Search APIs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                </div>

                {/* Mobile Category Selector */}
                <div className="lg:hidden mb-6">
                    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-4">
                        <label className="block text-slate-400 text-sm mb-2 font-semibold">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* API Cards */}
                <div className="space-y-8">
                    {filteredEndpoints.map((category, idx) => (
                        <div key={idx}>
                            <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                                <span>{category.icon}</span>
                                <span className="text-purple-400">{category.category}</span>
                                <span className="text-sm text-slate-500 font-normal">({category.apis.length} APIs)</span>
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.apis.map((api, i) => (
                                    <div 
                                        key={i}
                                        onClick={() => { 
                                            setSelectedEndpoint(api); 
                                            setTestParams({}); 
                                            setTestResult(null); 
                                            setCopiedResponse(false); 
                                        }}
                                        className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border p-6 hover:border-purple-500 transition-all cursor-pointer group ${
                                            api.featured ? 'border-yellow-500 ring-2 ring-yellow-500/30' : 'border-slate-800'
                                        }`}
                                    >
                                        {api.featured && (
                                            <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full font-bold mb-2 inline-block">
                                                ⭐ FEATURED
                                            </span>
                                        )}
                                        <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400">{api.name}</h3>
                                        <p className="text-slate-400 text-sm mb-4">{api.desc}</p>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                api.status === 'active' 
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                                                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                            }`}>
                                                {api.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded font-mono">
                                                {api.method}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* No Results */}
                {filteredEndpoints.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-bold mb-2">No APIs Found</h3>
                        <p className="text-slate-400">Try adjusting your search or category filter</p>
                    </div>
                )}

                {/* Test Modal */}
                {selectedEndpoint && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setSelectedEndpoint(null)}>
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">{selectedEndpoint.name}</h2>
                                <button onClick={() => setSelectedEndpoint(null)} className="text-slate-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <p className="text-slate-400 mb-6">{selectedEndpoint.desc}</p>

                            {/* Endpoint Info */}
                            <div className="mb-6">
                                <h3 className="font-bold mb-3 text-purple-400">Endpoint</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            selectedEndpoint.method === 'GET' ? 'bg-green-500 text-black' : 'bg-blue-500 text-white'
                                        }`}>
                                            {selectedEndpoint.method}
                                        </span>
                                        <code className="text-purple-400 text-sm break-all">{selectedEndpoint.endpoint}</code>
                                    </div>
                                    <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                                        🔒 Secure: Third-party API keys are hidden in backend
                                    </div>
                                </div>
                            </div>

                            {/* Test Parameters */}
                            {selectedEndpoint.params && (
                                <div className="mb-6">
                                    <h3 className="font-bold mb-3 text-purple-400">Test Parameters</h3>
                                    <div className="space-y-3">
                                        {Object.entries(selectedEndpoint.params).map(([key, config]) => (
                                            <div key={key}>
                                                <label className="block text-slate-400 text-sm mb-2">
                                                    {config.label} {config.required && <span className="text-red-400">*</span>}
                                                </label>
                                                {config.type === 'select' ? (
                                                    <select
                                                        value={testParams[key] || config.default || ''}
                                                        onChange={(e) => setTestParams({...testParams, [key]: e.target.value})}
                                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none"
                                                    >
                                                        {config.options.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder={config.placeholder}
                                                        value={testParams[key] || ''}
                                                        onChange={(e) => setTestParams({...testParams, [key]: e.target.value})}
                                                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg outline-none"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Test Button */}
                            <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
                                <div>
                                    <p className="font-semibold text-yellow-400">Cost: 5 coins</p>
                                    <p className="text-slate-400 text-sm">Your balance: {userData?.balance || 0} coins</p>
                                </div>
                                <button
                                    onClick={handleTestApi}
                                    disabled={testLoading || !userData?.apiKey}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {testLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Testing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Test API</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Test Result */}
                            {testResult && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-purple-400">Response</h3>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={copyResponse}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center space-x-2"
                                            >
                                                {copiedResponse ? (
                                                    <>
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        <span>Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>Copy</span>
                                                    </>
                                                )}
                                            </button>

                                            {extractDownloadUrl(testResult.data) && (
                                                <button
                                                    onClick={() => window.open(extractDownloadUrl(testResult.data), '_blank')}
                                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold flex items-center space-x-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    <span>Download</span>
                                                </button>
                                            )}

                                            <button
                                                onClick={openResponseUrl}
                                                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center space-x-2"
                                                title="Open URL with your API key"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                <span>Open URL</span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Info Note */}
                                    <div className="mb-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded text-xs text-purple-400 flex items-center space-x-2">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span>💡 "Open URL" will include your API key for direct browser testing</span>
                                    </div>
                                    
                                    <div className={`bg-slate-950/50 rounded-lg p-4 border ${
                                        testResult.status >= 200 && testResult.status < 300 ? 'border-green-500/30' : 'border-red-500/30'
                                    }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-bold ${
                                                testResult.status >= 200 && testResult.status < 300 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                Status: {testResult.status}
                                            </span>
                                        </div>
                                        <pre className="text-slate-300 text-sm overflow-x-auto whitespace-pre-wrap max-h-96">
                                            {JSON.stringify(testResult.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
