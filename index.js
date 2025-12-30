// FILE: index.js - Firebase Functions with Perplexity AI Scraper

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

admin.initializeApp();

// ============================================
// PERPLEXITY AI SCRAPER API ENDPOINT
// ============================================

exports.perplexitySearch = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('');
    }

    try {
        // Get API key from headers
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key is required',
                message: 'Please provide x-api-key in headers'
            });
        }

        // Verify API key and get user
        const userSnapshot = await admin.firestore()
            .collection('users')
            .where('apiKey', '==', apiKey)
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key',
                message: 'API key not found or invalid'
            });
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Check if user is active
        if (userData.status !== 'active') {
            return res.status(403).json({
                success: false,
                error: 'Account suspended',
                message: 'Your account has been suspended'
            });
        }

        // Check if API key is paused
        if (userData.apiKeyPaused) {
            return res.status(403).json({
                success: false,
                error: 'API key paused',
                message: 'Your API key has been paused'
            });
        }

        // Get cost per call from settings
        const settingsDoc = await admin.firestore()
            .collection('settings')
            .doc('system')
            .get();
        
        const costPerCall = settingsDoc.exists ? (settingsDoc.data().apiCostPerCall || 5) : 5;

        // Check if user has sufficient balance
        if (userData.balance < costPerCall) {
            return res.status(402).json({
                success: false,
                error: 'Insufficient balance',
                message: `You need at least ${costPerCall} coins. Your balance: ${userData.balance} coins`,
                required_coins: costPerCall,
                current_balance: userData.balance
            });
        }

        // Get query and source from request
        const { query, source = { web: true, academic: false, social: false, finance: false } } = req.method === 'GET' ? req.query : req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required',
                message: 'Please provide a query parameter'
            });
        }

        // Parse source if it's a string (from GET request)
        let parsedSource = source;
        if (typeof source === 'string') {
            try {
                parsedSource = JSON.parse(source);
            } catch (e) {
                parsedSource = { web: true, academic: false, social: false, finance: false };
            }
        }

        console.log(`🔍 Processing Perplexity search for user ${userData.email}: "${query}"`);

        // Call Perplexity API
        const sourceMapping = {
            web: 'web',
            academic: 'scholar',
            social: 'social',
            finance: 'edgar'
        };

        const activeSources = Object.keys(parsedSource)
            .filter(key => parsedSource[key] === true)
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
                    'answer_modes', 'media_items', 'knowledge_cards',
                    'inline_entity_cards', 'place_widgets', 'finance_widgets',
                    'sports_widgets', 'flight_status_widgets', 'shopping_widgets',
                    'jobs_widgets', 'search_result_widgets', 'clarification_responses',
                    'inline_images', 'inline_assets', 'inline_finance_widgets',
                    'placeholder_cards', 'diff_blocks', 'inline_knowledge_cards',
                    'entity_group_v2', 'refinement_filters', 'canvas_mode',
                    'maps_preview', 'answer_tabs'
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
                'x-request-id': frontend,
                'x-perplexity-request-reason': 'perplexity-query-state-provider'
            },
            timeout: 30000
        });

        // Parse Perplexity response
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
            throw new Error('No result found from Perplexity');
        }

        // Deduct coins from user balance
        await admin.firestore().collection('users').doc(userId).update({
            balance: admin.firestore.FieldValue.increment(-costPerCall),
            totalCalls: admin.firestore.FieldValue.increment(1)
        });

        // Add transaction record
        await admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .add({
                type: 'usage',
                amount: -costPerCall,
                endpoint: '/api/v1/perplexity-search',
                description: `Perplexity AI Search: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

        console.log(`✅ Perplexity search completed for ${userData.email}. Coins deducted: ${costPerCall}`);

        // Return response
        return res.status(200).json({
            success: true,
            data: {
                answer: answer,
                search_results: searchResults,
                query: query,
                sources_used: activeSources.length > 0 ? activeSources : ['web']
            },
            usage: {
                coins_used: costPerCall,
                remaining_balance: userData.balance - costPerCall
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Perplexity API Error:', error);

        let errorMessage = 'Internal server error';
        let statusCode = 500;

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage = 'Request timeout. Perplexity AI is taking too long to respond.';
            statusCode = 504;
        } else if (error.response) {
            errorMessage = error.response.data?.error || 'External API error';
            statusCode = error.response.status || 500;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            message: 'Failed to process Perplexity search request'
        });
    }
});

// ============================================
// TEST FUNCTION
// ============================================

exports.testPerplexity = functions.https.onCall(async (data, context) => {
    console.log('🧪 Test function called');
    return {
        success: true,
        message: 'Firebase Functions are working!',
        timestamp: new Date().toISOString()
    };
});
