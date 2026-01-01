// FILE: scrapers/darkshan.js
// DarkShan API Scraper Functions

const axios = require('axios');

// DarkShan API Configuration
const DARKSHAN_CONFIG = {
    baseUrl: 'https://api-dark-shan-yt.koyeb.app',
    apiKey: process.env.DARKSHAN_API_KEY || 'ccf6b1bdd4b26847',
    timeout: 30000
};

/**
 * CineSubz Movie Search
 * @param {string} query - Movie search query
 * @returns {Promise<Object>} Search results
 */
async function cinesubzSearch(query) {
    try {
        const { data } = await axios.get(`${DARKSHAN_CONFIG.baseUrl}/movie/cinesubz-search`, {
            params: {
                q: query,
                apikey: DARKSHAN_CONFIG.apiKey
            },
            timeout: DARKSHAN_CONFIG.timeout
        });

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('CineSubz Search Error:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * CineSubz Movie Info
 * @param {string} url - Movie URL
 * @returns {Promise<Object>} Movie information
 */
async function cinesubzMovieInfo(url) {
    try {
        const { data } = await axios.get(`${DARKSHAN_CONFIG.baseUrl}/movie/cinesubz-info`, {
            params: {
                url: url,
                apikey: DARKSHAN_CONFIG.apiKey
            },
            timeout: DARKSHAN_CONFIG.timeout
        });

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('CineSubz Movie Info Error:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * CineSubz TV Series Info
 * @param {string} url - TV series URL
 * @returns {Promise<Object>} TV series information
 */
async function cinesubzTvInfo(url) {
    try {
        const { data } = await axios.get(`${DARKSHAN_CONFIG.baseUrl}/tv/cinesubz-info`, {
            params: {
                url: url,
                apikey: DARKSHAN_CONFIG.apiKey
            },
            timeout: DARKSHAN_CONFIG.timeout
        });

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('CineSubz TV Info Error:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * CineSubz Episode Info
 * @param {string} url - Episode URL
 * @returns {Promise<Object>} Episode information
 */
async function cinesubzEpisodeInfo(url) {
    try {
        const { data } = await axios.get(`${DARKSHAN_CONFIG.baseUrl}/episode/cinesubz-info`, {
            params: {
                url: url,
                apikey: DARKSHAN_CONFIG.apiKey
            },
            timeout: DARKSHAN_CONFIG.timeout
        });

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('CineSubz Episode Info Error:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * CineSubz Movie Download
 * @param {string} url - Download URL
 * @returns {Promise<Object>} Download links
 */
async function cinesubzDownload(url) {
    try {
        const { data } = await axios.get(`${DARKSHAN_CONFIG.baseUrl}/movie/cinesubz-download`, {
            params: {
                url: url,
                apikey: DARKSHAN_CONFIG.apiKey
            },
            timeout: DARKSHAN_CONFIG.timeout
        });

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('CineSubz Download Error:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Generic DarkShan API Call
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
async function genericDarkShanCall(endpoint, params = {}) {
    try {
        const { data } = await axios.get(`${DARKSHAN_CONFIG.baseUrl}${endpoint}`, {
            params: {
                ...params,
                apikey: DARKSHAN_CONFIG.apiKey
            },
            timeout: DARKSHAN_CONFIG.timeout
        });

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error(`DarkShan API Error (${endpoint}):`, error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

module.exports = {
    cinesubzSearch,
    cinesubzMovieInfo,
    cinesubzTvInfo,
    cinesubzEpisodeInfo,
    cinesubzDownload,
    genericDarkShanCall
};
