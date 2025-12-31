// FILE: index.js - Main Express Server with Perplexity AI + YouTube APIs

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const axios = require('axios');
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

// Import YouTube Scrapers
const { search, ytmp3, ytmp4, transcript, playmp3, playmp4 } = require('./scrapers/youtube');

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
    version: '1.0.0',
    endpoints: {
      perplexity: '/api/perplexity-search',
      youtube_search: '/api/youtube/search',
      youtube_mp3: '/api/youtube/mp3',
      youtube_mp4: '/api/youtube/mp4',
      youtube_transcript: '/api/youtube/transcript',
      youtube_playmp3: '/api/youtube/playmp3',
      youtube_playmp4: '/api/youtube/playmp4'
    },
    authentication: firebaseInitialized ? 'enabled' : 'test mode',
    documentation: 'https://docs.kaliyax.com'
  });
});

// ==========================================
// PERPLEXITY AI API
// ==========================================

app.post('/api/perplexity-search', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey && firebaseInitialized) {
      return res.status(401).json({ success: false, error: 'API key required' });
    }

    const auth = await verifyAndDeductCoins(apiKey, '/api/perplexity-search');
    if (!auth.success) {
      return res.status(auth.code).json({
        success: false,
        error: auth.error,
        required_coins: auth.required,
        current_balance: auth.current
      });
    }

    const { query, source = { web: true, academic: false, social: false, finance: false } } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const sourceMapping = {
      web: 'web',
      academic: 'scholar',
      social: 'social',
      finance: 'edgar'
    };

    const activeSources = Object.keys(source)
      .filter(key => source[key] === true)
      .map(key => sourceMapping[key])
      .filter(Boolean);

    const frontend = uuidv4();

    const { data } = await axios.post('https://api.nekolabs.web.id/px?url=https://www.perplexity.ai/rest/sse/perplexity_ask', {
      params: {
        attachments: [],
        language: 'en-US',
        timezone: 'Asia/Colombo',
        search_focus: 'internet',
        sources: activeSources.length > 0 ? activeSources : ['web'],
        search_recency_filter: null,
        frontend_uuid: frontend,
        mode: 'concise',
        model_preference: 'turbo',
        is_related_query: false,
        is_sponsored: false,
        visitor_id: uuidv4(),
        frontend_context_uuid: uuidv4(),
        prompt_source: 'user',
        query_source: 'home',
        is_incognito: false,
        time_from_first_type: 2273.9,
        local_search_enabled: false,
        use_schematized_api: true,
        send_back_text_in_streaming_api: false,
        supported_block_use_cases: [
          'answer_modes', 'media_items', 'knowledge_cards'
        ],
        client_coordinates: null,
        mentions: [],
        dsl_query: query,
        skip_search_enabled: true,
        is_nav_suggestions_disabled: false,
        always_search_override: false,
        override_no_search: false,
        comet_max_assistant_enabled: false,
        should_ask_for_mcp_tool_confirmation: true,
        version: '2.18'
      },
      query_str: query
    }, {
      headers: {
        'content-type': 'application/json',
        'referer': 'https://www.perplexity.ai/search/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'x-request-id': frontend
      },
      timeout: 30000
    });

    const info = JSON.parse(
      data.result.content
        .split('\n')
        .filter(l => l.startsWith('data:'))
        .map(l => JSON.parse(l.slice(6)))
        .find(l => l.final_sse_message).text
    );

    const answer = JSON.parse(
      info.find(s => s.step_type === 'FINAL')?.content?.answer || '{}'
    ).answer;

    const searchResults = info.find(s => s.step_type === 'SEARCH_RESULTS')?.content?.web_results || [];

    if (!answer) {
      throw new Error('No result from Perplexity');
    }

    return handleApiResponse(res, auth, {
      answer: answer,
      search_results: searchResults,
      query: query,
      sources_used: activeSources.length > 0 ? activeSources : ['web']
    });

  } catch (error) {
    console.error('❌ Perplexity error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// YOUTUBE APIs
// ==========================================

// YouTube Search
app.get('/api/youtube/search', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
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

// YouTube MP3
app.get('/api/youtube/mp3', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
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

// YouTube MP4
app.get('/api/youtube/mp4', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
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

// YouTube Transcript
app.get('/api/youtube/transcript', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
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

// YouTube Play MP3
app.get('/api/youtube/playmp3', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
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

// YouTube Play MP4
app.get('/api/youtube/playmp4', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
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
// START SERVER
// ==========================================

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`🔐 Authentication: ${firebaseInitialized ? 'ENABLED' : 'TEST MODE'}`);
});
