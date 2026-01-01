// FILE: index.js - Main Express Server with Clean Routes

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// FIREBASE INITIALIZATION
// ==========================================

let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not set');
  }
} catch (error) {
  console.error('❌ Firebase init error:', error.message);
}

const db = firebaseInitialized ? admin.firestore() : null;

// Import Scrapers
const { search, ytmp3, ytmp4, transcript, playmp3, playmp4 } = require('./scrapers/youtube');
const {
  cinesubzSearch,
  cinesubzMovieInfo,
  cinesubzTvInfo,
  cinesubzEpisodeInfo,
  cinesubzDownload,
  genericDarkShanCall
} = require('./scrapers/darkshan');

// ==========================================
// AUTHENTICATION & COIN DEDUCTION
// ==========================================

async function verifyAndDeductCoins(apiKey, endpoint) {
  if (!firebaseInitialized || !db) {
    return {
      success: true,
      testMode: true,
      coinsDeducted: 0,
      remainingBalance: 0
    };
  }

  try {
    const userSnapshot = await db.collection('users')
      .where('apiKey', '==', apiKey)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return { success: false, code: 401, error: 'Invalid API key' };
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    if (userData.status !== 'active') {
      return { success: false, code: 403, error: 'Account suspended' };
    }

    if (userData.apiKeyPaused) {
      return { success: false, code: 403, error: 'API key paused' };
    }

    const settingsDoc = await db.collection('settings').doc('system').get();
    const costPerCall = settingsDoc.exists ? (settingsDoc.data().apiCostPerCall || 5) : 5;

    if (userData.balance < costPerCall) {
      return {
        success: false,
        code: 402,
        error: 'Insufficient balance',
        required: costPerCall,
        current: userData.balance
      };
    }

    await db.collection('users').doc(userId).update({
      balance: admin.firestore.FieldValue.increment(-costPerCall),
      totalCalls: admin.firestore.FieldValue.increment(1)
    });

    await db.collection('users').doc(userId).collection('transactions').add({
      type: 'usage',
      amount: -costPerCall,
      endpoint: endpoint,
      description: `API Call: ${endpoint}`,
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
    console.error('❌ Auth error:', error);
    return { success: false, code: 500, error: 'Internal server error' };
  }
}

// ✅ Helper function to get API key from request (header OR query parameter)
function getApiKey(req) {
  // Try header first (preferred method)
  let apiKey = req.headers['x-api-key'];
  
  // If not in header, try query parameter (for browser testing)
  if (!apiKey) {
    apiKey = req.query['x-api-key'] || req.query['apikey'];
  }
  
  return apiKey;
}

function handleApiResponse(res, auth, data, error = null) {
  if (!auth.success) {
    return res.status(auth.code || 500).json({
      success: false,
      error: auth.error,
      required_coins: auth.required,
      current_balance: auth.current
    });
  }

  if (error) {
    return res.status(500).json({ success: false, error: error });
  }

  const response = { success: true, data: data };

  if (!auth.testMode) {
    response.usage = {
      coins_used: auth.coinsDeducted,
      remaining_balance: auth.remainingBalance
    };
  } else {
    response.test_mode = true;
  }

  return res.status(200).json(response);
}

// ==========================================
// ROOT ENDPOINT
// ==========================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KaliyaX API Portal',
    version: '2.0.0',
    endpoints: {
      youtube: {
        search: '/api/youtube/search',
        mp3: '/api/youtube/mp3',
        mp4: '/api/youtube/mp4',
        transcript: '/api/youtube/transcript',
        playmp3: '/api/youtube/playmp3',
        playmp4: '/api/youtube/playmp4'
      },
      movies: {
        search: '/api/movie/cinesubz-search',
        info: '/api/movie/cinesubz-info',
        download: '/api/movie/cinesubz-download'
      },
      tv: {
        info: '/api/tv/cinesubz-info'
      },
      episode: {
        info: '/api/episode/cinesubz-info'
      }
    },
    authentication: firebaseInitialized ? 'enabled' : 'test mode',
    documentation: 'https://docs.kaliyax.com'
  });
});

// ==========================================
// YOUTUBE APIs
// ==========================================

// YouTube Search
app.get('/api/youtube/search', async (req, res) => {
  try {
    const apiKey = getApiKey(req); // ✅ Get from header OR query parameter
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/youtube/search');
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const response = await search(q);
    return handleApiResponse(res, auth, response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/youtube/mp3', async (req, res) => {
  try {
    const apiKey = getApiKey(req); // ✅ Get from header OR query parameter
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/youtube/mp3');
    const { url, quality } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const response = await ytmp3(url, quality);
    return handleApiResponse(res, auth, response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/youtube/mp4', async (req, res) => {
  try {
    const apiKey = getApiKey(req); // ✅ Get from header OR query parameter
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/youtube/mp4');
    const { url, quality } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const response = await ytmp4(url, quality);
    return handleApiResponse(res, auth, response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/youtube/transcript', async (req, res) => {
  try {
    const apiKey = getApiKey(req); // ✅ Get from header OR query parameter
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/youtube/transcript');
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const response = await transcript(url);
    return handleApiResponse(res, auth, response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/youtube/playmp3', async (req, res) => {
  try {
    const apiKey = getApiKey(req); // ✅ Get from header OR query parameter
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/youtube/playmp3');
    const { q, quality } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const response = await playmp3(q, quality);
    return handleApiResponse(res, auth, response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/youtube/playmp4', async (req, res) => {
  try {
    const apiKey = getApiKey(req); // ✅ Get from header OR query parameter
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/youtube/playmp4');
    const { q, quality } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const response = await playmp4(q, quality);
    return handleApiResponse(res, auth, response);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// DARKSHAN CINESUBZ APIs
// ==========================================

// CineSubz Movie Search
app.get('/api/movie/cinesubz-search', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/movie/cinesubz-search');
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter (q) required' });
    }

    const result = await cinesubzSearch(q);
    return handleApiResponse(res, auth, result.data, result.success ? null : result.error);

  } catch (error) {
    console.error('❌ CineSubz Search error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// CineSubz Movie Info
app.get('/api/movie/cinesubz-info', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/movie/cinesubz-info');
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const result = await cinesubzMovieInfo(url);
    return handleApiResponse(res, auth, result.data, result.success ? null : result.error);

  } catch (error) {
    console.error('❌ CineSubz Movie Info error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// CineSubz TV Series Info
app.get('/api/tv/cinesubz-info', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/tv/cinesubz-info');
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const result = await cinesubzTvInfo(url);
    return handleApiResponse(res, auth, result.data, result.success ? null : result.error);

  } catch (error) {
    console.error('❌ CineSubz TV Info error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// CineSubz Episode Info
app.get('/api/episode/cinesubz-info', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/episode/cinesubz-info');
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const result = await cinesubzEpisodeInfo(url);
    return handleApiResponse(res, auth, result.data, result.success ? null : result.error);

  } catch (error) {
    console.error('❌ CineSubz Episode Info error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// CineSubz Movie Download
app.get('/api/movie/cinesubz-download', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/movie/cinesubz-download');
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const result = await cinesubzDownload(url);
    return handleApiResponse(res, auth, result.data, result.success ? null : result.error);

  } catch (error) {
    console.error('❌ CineSubz Download error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Generic DarkShan Proxy (for any other endpoint)
app.get('/api/darkshan/*', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const endpoint = req.params[0];
    const auth = await verifyAndDeductCoins(apiKey, `/api/darkshan/${endpoint}`);
    
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const result = await genericDarkShanCall(`/${endpoint}`, req.query);
    return handleApiResponse(res, auth, result.data, result.success ? null : result.error);

  } catch (error) {
    console.error('❌ DarkShan Proxy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// START SERVER
// ==========================================

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔐 Authentication: ${firebaseInitialized ? 'ENABLED' : 'TEST MODE'}`);
  console.log(`✅ All routes loaded`);
});
