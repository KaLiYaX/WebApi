// FILE: src/ApiLibraryTab.jsx
// API Library Tab Component

function ApiLibraryTab() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);

    const endpoints = [
        { 
            category: 'AI & ML', 
            apis: [
                { name: 'GPT Chat', desc: 'Conversational AI powered by GPT', status: 'active', endpoint: '/api/v1/gpt-chat' },
                { name: 'Image Generation', desc: 'Generate AI images from text prompts', status: 'active', endpoint: '/api/v1/image-gen' },
                { name: 'Text to Speech', desc: 'Convert text to natural speech', status: 'active', endpoint: '/api/v1/tts' },
                { name: 'Speech to Text', desc: 'Transcribe audio to text', status: 'active', endpoint: '/api/v1/stt' },
                { name: 'Sentiment Analysis', desc: 'Analyze text sentiment and emotions', status: 'beta', endpoint: '/api/v1/sentiment' }
            ]
        },
        { 
            category: 'Data', 
            apis: [
                { name: 'Weather API', desc: 'Real-time weather data worldwide', status: 'active', endpoint: '/api/v1/weather' },
                { name: 'Currency Exchange', desc: 'Live currency exchange rates', status: 'active', endpoint: '/api/v1/currency' },
                { name: 'Stock Prices', desc: 'Real-time stock market data', status: 'active', endpoint: '/api/v1/stocks' },
                { name: 'News Feed', desc: 'Latest news articles and headlines', status: 'active', endpoint: '/api/v1/news' },
                { name: 'Crypto Prices', desc: 'Cryptocurrency real-time prices', status: 'active', endpoint: '/api/v1/crypto' }
            ]
        },
        { 
            category: 'Utils', 
            apis: [
                { name: 'QR Generator', desc: 'Generate QR codes instantly', status: 'active', endpoint: '/api/v1/qr-gen' },
                { name: 'URL Shortener', desc: 'Shorten long URLs easily', status: 'active', endpoint: '/api/v1/url-short' },
                { name: 'Email Validator', desc: 'Validate email addresses', status: 'active', endpoint: '/api/v1/email-validate' },
                { name: 'PDF Generator', desc: 'Convert HTML to PDF documents', status: 'beta', endpoint: '/api/v1/pdf-gen' },
                { name: 'Image Resize', desc: 'Resize and optimize images', status: 'active', endpoint: '/api/v1/img-resize' }
            ]
        },
        { 
            category: 'Social', 
            apis: [
                { name: 'Instagram Data', desc: 'Get Instagram profile information', status: 'active', endpoint: '/api/v1/instagram' },
                { name: 'Twitter Scraper', desc: 'Extract Twitter data and tweets', status: 'active', endpoint: '/api/v1/twitter' },
                { name: 'YouTube Stats', desc: 'YouTube video statistics and data', status: 'active', endpoint: '/api/v1/youtube' },
                { name: 'TikTok Info', desc: 'TikTok video information', status: 'beta', endpoint: '/api/v1/tiktok' },
                { name: 'Facebook Graph', desc: 'Facebook Graph API access', status: 'active', endpoint: '/api/v1/facebook' }
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
                                    className="bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-800 p-6 hover:border-purple-500 transition-all cursor-pointer group"
                                >
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
                            <div>
                                <h3 className="font-bold mb-3 text-purple-400">Endpoint</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center space-x-3">
                                        <span className="bg-green-500 text-black px-2 py-1 rounded text-xs font-bold">GET</span>
                                        <code className="text-purple-400">{selectedEndpoint.endpoint}</code>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-3 text-purple-400">Headers</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 font-mono text-sm">
                                    <div className="text-slate-400">
                                        <span className="text-purple-400">x-api-key</span>: YOUR_API_KEY
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold mb-3 text-purple-400">Example Response</h3>
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 font-mono text-sm overflow-x-auto">
                                    <pre className="text-slate-400">{`{
  "status": "success",
  "data": {
    "result": "..."
  },
  "credits_used": 5
}`}</pre>
                                </div>
                            </div>

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
