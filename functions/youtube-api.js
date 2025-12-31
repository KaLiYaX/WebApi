// FILE: functions/youtube-api.js
// YouTube API Handler with Coin Deduction

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const yts = require('yt-search');
const { createDecipheriv } = require('crypto');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const extractVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
    const result = url.match(regex);
    return result ? result[1] : null;
};

const audioQualities = [32, 64, 96, 128, 160, 192, 256, 320];
const videoQualities = [144, 240, 360, 480, 720, 1080, 1440];

const decryptInfo = (encoded) => {
    const secret = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
    const buffer = Buffer.from(encoded, 'base64');
    const iv = buffer.slice(0, 16);
    const encrypted = buffer.slice(16);
    const key = Buffer.from(secret, 'hex');

    const decipher = createDecipheriv('aes-128-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString());
};

const fetchDownload = async (url, quality, type) => {
    try {
        const { data: cdnData } = await axios.get('https://media.savetube.me/api/random-cdn');
        const cdnUrl = `https://${cdnData.cdn}`;

        const { data: infoEnc } = await axios.post(`${cdnUrl}/v2/info`, { url }, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Android)',
                'Referer': 'https://yt.savetube.me/1kejjj1?id=362796039'
            }
        });

        const info = decryptInfo(infoEnc.data);

        const { data: downloadRes } = await axios.post(`${cdnUrl}/download`, {
            downloadType: type,
            quality: String(quality),
            key: info.key
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Android)',
                'Referer': 'https://yt.savetube.me/start-download?from=1kejjj1%3Fid%3D362796039'
            }
        });

        let size = null;
        try {
            const { headers } = await axios.head(downloadRes.data.downloadUrl);
            size = headers['content-length'] ? Number(headers['content-length']) : null;
        } catch (e) {
            console.warn('Failed to get file size:', e.message);
        }

        return {
            status: true,
            url: downloadRes.data.downloadUrl,
            quality: `${quality}${type === 'audio' ? 'kbps' : 'p'}`,
            availableQuality: type === 'audio' ? audioQualities : videoQualities,
            size,
            filename: `${info.title} (${quality}${type === 'audio' ? 'kbps).mp3' : 'p).mp4'}`
        };

    } catch (err) {
        console.error('Download error:', err.message);
        return { status: false, message: 'Download failed' };
    }
};

// ==========================================
// AUTHENTICATION & COIN DEDUCTION
// ==========================================

const verifyAndDeductCoins = async (apiKey, endpoint) => {
    try {
        // Get user by API key
        const userSnapshot = await admin.firestore()
            .collection('users')
            .where('apiKey', '==', apiKey)
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            return { 
                success: false, 
                code: 401,
                error: 'Invalid API key' 
            };
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Check if user is active
        if (userData.status !== 'active') {
            return { 
                success: false,
                code: 403,
                error: 'Account suspended' 
            };
        }

        // Check if API key is paused
        if (userData.apiKeyPaused) {
            return { 
                success: false,
                code: 403,
                error: 'API key paused' 
            };
        }

        // Get cost per call from settings
        const settingsDoc = await admin.firestore()
            .collection('settings')
            .doc('system')
            .get();
        
        const costPerCall = settingsDoc.exists ? (settingsDoc.data().apiCostPerCall || 5) : 5;

        // Check balance
        if (userData.balance < costPerCall) {
            return { 
                success: false,
                code: 402,
                error: 'Insufficient balance',
                required: costPerCall,
                current: userData.balance
            };
        }

        // Deduct coins
        await admin.firestore().collection('users').doc(userId).update({
            balance: admin.firestore.FieldValue.increment(-costPerCall),
            totalCalls: admin.firestore.FieldValue.increment(1)
        });

        // Add transaction
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .add({
                type: 'usage',
                amount: -costPerCall,
                endpoint: endpoint,
                description: `YouTube API: ${endpoint}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        console.log(`✅ Deducted ${costPerCall} coins from ${userData.email} for ${endpoint}`);

        return {
            success: true,
            userId,
            email: userData.email,
            coinsDeducted: costPerCall,
            remainingBalance: userData.balance - costPerCall
        };

    } catch (error) {
        console.error('Auth error:', error);
        return { 
            success: false,
            code: 500,
            error: 'Internal server error' 
        };
    }
};

// ==========================================
// API ENDPOINTS
// ==========================================

// YouTube Search
exports.ytSearch = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required'
            });
        }

        // Verify and deduct coins
        const auth = await verifyAndDeductCoins(apiKey, '/api/v1/youtube/search');
        if (!auth.success) {
            return res.status(auth.code).json({
                success: false,
                error: auth.error,
                required_coins: auth.required,
                current_balance: auth.current
            });
        }

        const { q } = req.method === 'GET' ? req.query : req.body;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter required'
            });
        }

        const data = await yts(q);

        return res.status(200).json({
            success: true,
            data: {
                results: data.all
            },
            usage: {
                coins_used: auth.coinsDeducted,
                remaining_balance: auth.remainingBalance
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// YouTube MP3 Download
exports.ytmp3 = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required'
            });
        }

        const auth = await verifyAndDeductCoins(apiKey, '/api/v1/youtube/mp3');
        if (!auth.success) {
            return res.status(auth.code).json({
                success: false,
                error: auth.error,
                required_coins: auth.required,
                current_balance: auth.current
            });
        }

        const { url, quality = 128 } = req.method === 'GET' ? req.query : req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter required'
            });
        }

        const id = extractVideoId(url);
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL'
            });
        }

        const finalQuality = audioQualities.includes(+quality) ? +quality : 128;
        const videoUrl = `https://youtube.com/watch?v=${id}`;

        const info = await yts(videoUrl);
        const download = await fetchDownload(videoUrl, finalQuality, 'audio');

        return res.status(200).json({
            success: true,
            data: {
                metadata: info.all[0],
                download: download
            },
            usage: {
                coins_used: auth.coinsDeducted,
                remaining_balance: auth.remainingBalance
            }
        });

    } catch (error) {
        console.error('MP3 error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// YouTube MP4 Download
exports.ytmp4 = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required'
            });
        }

        const auth = await verifyAndDeductCoins(apiKey, '/api/v1/youtube/mp4');
        if (!auth.success) {
            return res.status(auth.code).json({
                success: false,
                error: auth.error,
                required_coins: auth.required,
                current_balance: auth.current
            });
        }

        const { url, quality = 360 } = req.method === 'GET' ? req.query : req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter required'
            });
        }

        const id = extractVideoId(url);
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Invalid YouTube URL'
            });
        }

        const finalQuality = videoQualities.includes(+quality) ? +quality : 360;
        const videoUrl = `https://youtube.com/watch?v=${id}`;

        const info = await yts(videoUrl);
        const download = await fetchDownload(videoUrl, finalQuality, 'video');

        return res.status(200).json({
            success: true,
            data: {
                metadata: info.all[0],
                download: download
            },
            usage: {
                coins_used: auth.coinsDeducted,
                remaining_balance: auth.remainingBalance
            }
        });

    } catch (error) {
        console.error('MP4 error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// YouTube Transcript
exports.ytTranscript = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required'
            });
        }

        const auth = await verifyAndDeductCoins(apiKey, '/api/v1/youtube/transcript');
        if (!auth.success) {
            return res.status(auth.code).json({
                success: false,
                error: auth.error,
                required_coins: auth.required,
                current_balance: auth.current
            });
        }

        const { url } = req.method === 'GET' ? req.query : req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL parameter required'
            });
        }

        const response = await axios.get('https://yts.kooska.xyz/', {
            params: { url: url },
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                'Referer': 'https://kooska.xyz/'
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                video_id: response.data.video_id,
                summarize: response.data.ai_response,
                transcript: response.data.transcript
            },
            usage: {
                coins_used: auth.coinsDeducted,
                remaining_balance: auth.remainingBalance
            }
        });

    } catch (error) {
        console.error('Transcript error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Play MP3 (Search + Download)
exports.playmp3 = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required'
            });
        }

        const auth = await verifyAndDeductCoins(apiKey, '/api/v1/youtube/playmp3');
        if (!auth.success) {
            return res.status(auth.code).json({
                success: false,
                error: auth.error,
                required_coins: auth.required,
                current_balance: auth.current
            });
        }

        const { q, quality = 128 } = req.method === 'GET' ? req.query : req.body;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter required'
            });
        }

        const searchResult = await yts(q);
        if (!searchResult.all.length) {
            return res.status(404).json({
                success: false,
                error: 'No videos found'
            });
        }

        const results = [];
        for (let video of searchResult.all.slice(0, 5)) {
            const downloadInfo = await fetchDownload(video.url, quality, 'audio');
            results.push({
                title: video.title,
                author: video.author.name,
                duration: video.timestamp,
                url: video.url,
                thumbnail: video.thumbnail,
                download: downloadInfo
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                type: 'audio',
                results
            },
            usage: {
                coins_used: auth.coinsDeducted,
                remaining_balance: auth.remainingBalance
            }
        });

    } catch (error) {
        console.error('PlayMP3 error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Play MP4 (Search + Download)
exports.playmp4 = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key required'
            });
        }

        const auth = await verifyAndDeductCoins(apiKey, '/api/v1/youtube/playmp4');
        if (!auth.success) {
            return res.status(auth.code).json({
                success: false,
                error: auth.error,
                required_coins: auth.required,
                current_balance: auth.current
            });
        }

        const { q, quality = 360 } = req.method === 'GET' ? req.query : req.body;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter required'
            });
        }

        const searchResult = await yts(q);
        if (!searchResult.all.length) {
            return res.status(404).json({
                success: false,
                error: 'No videos found'
            });
        }

        const results = [];
        for (let video of searchResult.all.slice(0, 5)) {
            const downloadInfo = await fetchDownload(video.url, quality, 'video');
            results.push({
                title: video.title,
                author: video.author.name,
                duration: video.timestamp,
                url: video.url,
                thumbnail: video.thumbnail,
                download: downloadInfo
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                type: 'video',
                results
            },
            usage: {
                coins_used: auth.coinsDeducted,
                remaining_balance: auth.remainingBalance
            }
        });

    } catch (error) {
        console.error('PlayMP4 error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
