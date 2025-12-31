// FILE: src/ApiLibraryTab.jsx - Updated with YouTube APIs

function ApiLibraryTab() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);

    const endpoints = [
        { 
            category: 'AI & ML', 
            apis: [
                { 
                    name: 'Perplexity AI Search', 
                    desc: 'Advanced AI-powered search with web, academic, social, and finance sources', 
                    status: 'active', 
                    endpoint: '/api/v1/perplexity-search',
                    method: 'POST',
                    featured: true
                },
                { name: 'GPT Chat', desc: 'Conversational AI powered by GPT', status: 'active', endpoint: '/api/v1/gpt-chat', method: 'POST' },
                { name: 'Image Generation', desc: 'Generate AI images from text prompts', status: 'active', endpoint: '/api/v1/image-gen', method: 'POST' },
                { name: 'Text to Speech', desc: 'Convert text to natural speech', status: 'active', endpoint: '/api/v1/tts', method: 'POST' },
                { name: 'Speech to Text', desc: 'Transcribe audio to text', status: 'active', endpoint: '/api/v1/stt', method: 'POST' },
                { name: 'Sentiment Analysis', desc: 'Analyze text sentiment and emotions', status: 'beta', endpoint: '/api/v1/sentiment', method: 'POST' }
            ]
        },
        { 
            category: 'Data', 
            apis: [
                { name: 'Weather API', desc: 'Real-time weather data worldwide', status: 'active', endpoint: '/api/v1/weather', method: 'GET' },
                { name: 'Currency Exchange', desc: 'Live currency exchange rates', status: 'active', endpoint: '/api/v1/currency', method: 'GET' },
                { name: 'Stock Prices', desc: 'Real-time stock market data', status: 'active', endpoint: '/api/v1/stocks', method: 'GET' },
                { name: 'News Feed', desc: 'Latest news articles and headlines', status: 'active', endpoint: '/api/v1/news', method: 'GET' },
                { name: 'Crypto Prices', desc: 'Cryptocurrency real-time prices', status: 'active', endpoint: '/api/v1/crypto', method: 'GET' }
            ]
        },
        { 
            category: 'Utils', 
            apis: [
                { name: 'QR Generator', desc: 'Generate QR codes instantly', status: 'active', endpoint: '/api/v1/qr-gen', method: 'POST' },
                { name: 'URL Shortener', desc: 'Shorten long URLs easily', status: 'active', endpoint: '/api/v1/url-short', method: 'POST' },
                { name: 'Email Validator', desc: 'Validate email addresses', status: 'active', endpoint: '/api/v1/email-validate', method: 'POST' },
                { name: 'PDF Generator', desc: 'Convert HTML to PDF documents', status: 'beta', endpoint: '/api/v1/pdf-gen', method: 'POST' },
                { name: 'Image Resize', desc: 'Resize and optimize images', status: 'active', endpoint: '/api/v1/img-resize', method: 'POST' }
            ]
        },
        { 
            category: 'Social', 
            apis: [
                { name: 'Instagram Data', desc: 'Get Instagram profile information', status: 'active', endpoint: '/api/v1/instagram', method: 'GET' },
                { name: 'Twitter Scraper', desc: 'Extract Twitter data and tweets', status: 'active', endpoint: '/api/v1/twitter', method: 'GET' },
                { name: 'Facebook Graph', desc: 'Facebook Graph API access', status: 'active', endpoint: '/api/v1/facebook', method: 'GET' },
                { name: 'TikTok Info', desc: 'TikTok video information', status: 'beta', endpoint: '/api/v1/tiktok', method: 'GET' }
            ]
        },
        { 
            category: 'YouTube', 
            apis: [
                { 
                    name: 'YouTube Search', 
                    desc: 'Search for YouTube videos by query', 
                    status: 'active', 
                    endpoint: '/api/v1/youtube/search',
                    method: 'GET',
                    featured: true,
                    params: { q: 'Search query' }
                },
                { 
                    name: 'YouTube MP3 Download', 
                    desc: 'Download YouTube videos as MP3 audio files', 
                    status: 'active', 
                    endpoint: '/api/v1/youtube/mp3',
                    method: 'GET',
                    featured: true,
                    params: { 
                        url: 'YouTube video URL',
                        quality: '128 (optional: 32, 64, 96, 128, 160, 192, 256, 320)'
                    }
                },
                { 
                    name: 'YouTube MP4 Download', 
                    desc: 'Download YouTube videos as MP4 video files', 
                    status: 'active', 
                    endpoint: '/api/v1/youtube/mp4',
                    method: 'GET',
                    params: { 
                        url: 'YouTube video URL',
                        quality: '360 (optional: 144, 240, 360, 480, 720, 1080, 1440)'
                    }
                },
                { 
                    name: 'YouTube Transcript', 
                    desc: 'Get video transcript with AI summarization', 
                    status: 'active', 
                    endpoint: '/api/v1/youtube/transcript',
                    method: 'GET',
                    params: { url: 'YouTube video URL' }
                },
                { 
                    name: 'Play MP3', 
                    desc: 'Search and get MP3 download links for top 5 results', 
                    status: 'active', 
                    endpoint: '/api/v1/youtube/playmp3',
                    method: 'GET',
                    params: { 
                        q: 'Search query',
                        quality: '128 (optional)'
                    }
                },
                { 
                    name: 'Play MP4', 
                    desc: 'Search and get MP4 download links for top 5 results', 
                    status: 'active', 
                    endpoint: '/api/v1/youtube/playmp4',
                    method: 'GET',
                    params: { 
                        q: 'Search query',
                        quality: '360 (optional)'
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

    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">API Library</h1>
                <p className="text-slate-400">Explore our comprehensive collection of APIs</p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 mb-8">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input 
                            type="text"
                            placeholder="Search APIs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                    selectedCategory === cat 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {filteredEndpoints.map((category, idx) => (
                    <div key={idx}>
                        <h2 className="text-2xl font-bold mb-4 text-purple-400">{category.category}</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.apis.map((api, i) => (
                                <div 
                                    key={i}
                                    onClick={() => setSelectedEndpoint(api)}
                                    className={`bg-slate-900/80 backdrop-blur-xl rounded-xl border p-6 hover:border-purple-500 transition-all cursor-pointer group ${
                                        api.featured ? 'border-yellow-500 ring-2 ring-yellow-500/30' : 'border-slate-800'
                                    }`}
                                >
                                    {api.featured && (
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full font-bold">
                                                ⭐ FEATURED
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors">{api.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            api.status === 'active' 
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                            {api.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{api.desc}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 font-mono">{api.endpoint}</span>
                                        <svg className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* API Details Modal */}
            {selectedEndpoint && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedEndpoint(null)}>
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">{selectedEndpoint.name}</h2>
                            <button onClick={() => setSelectedEndpoint(null)} className="text-slate-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-slate-400 mb-6">{selectedEndpoint.desc}</p>

                        <div className="space-y-6">
                            {/* Endpoint */}
                            <div>
                                <h3 className="font-bold mb-3 text-purple-400">Endpoint</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            selectedEndpoint.method === 'GET' 
                                                ? 'bg-green-500 text-black' 
                                                : 'bg-blue-500 text-white'
                                        }`}>
                                            {selectedEndpoint.method}
                                        </span>
                                        <code className="text-purple-400">{selectedEndpoint.endpoint}</code>
                                    </div>
                                </div>
                            </div>

                            {/* Headers */}
                            <div>
                                <h3 className="font-bold mb-3 text-purple-400">Headers</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 font-mono text-sm">
                                    <div className="text-slate-400">
                                        <span className="text-purple-400">x-api-key</span>: YOUR_API_KEY
                                    </div>
                                </div>
                            </div>

                            {/* Parameters */}
                            {selectedEndpoint.params && (
                                <div>
                                    <h3 className="font-bold mb-3 text-purple-400">Parameters</h3>
                                    <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                        {Object.entries(selectedEndpoint.params).map(([key, value]) => (
                                            <div key={key} className="mb-2 last:mb-0">
                                                <span className="text-green-400 font-mono">{key}</span>
                                                <span className="text-slate-500"> = </span>
                                                <span className="text-slate-400">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Example Request */}
                            <div>
                                <h3 className="font-bold mb-3 text-purple-400">Example Request</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 font-mono text-sm overflow-x-auto">
                                    <pre className="text-slate-400">{`curl -X ${selectedEndpoint.method} \\
  '${selectedEndpoint.endpoint}${selectedEndpoint.params ? '?' + Object.keys(selectedEndpoint.params)[0] + '=value' : ''}' \\
  -H 'x-api-key: YOUR_API_KEY'`}</pre>
                                </div>
                            </div>

                            {/* Cost Notice */}
                            <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <div>
                                    <p className="font-semibold text-yellow-400">Cost per Request</p>
                                    <p className="text-slate-400 text-sm">5 coins will be deducted</p>
                                </div>
                                <div className="text-2xl font-bold text-yellow-400">5 coins</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
