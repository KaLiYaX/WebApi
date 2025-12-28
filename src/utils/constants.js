// Application Constants for KaliyaX API Portal

// Coin Configuration
const COIN_CONFIG = {
    SIGNUP_BONUS: 100,
    REFERRAL_BONUS: 60,
    COST_PER_API_CALL: 5,
    MIN_TRANSFER_AMOUNT: 10,
    MAX_TRANSFER_AMOUNT: 10000
};

// Coin Packages
const COIN_PACKAGES = [
    {
        id: 'starter',
        name: 'Starter',
        coins: 500,
        price: 250,
        currency: 'LKR',
        discount: null,
        popular: false
    },
    {
        id: 'pro',
        name: 'Pro',
        coins: 2500,
        price: 1000,
        currency: 'LKR',
        discount: 20,
        popular: true
    },
    {
        id: 'ultimate',
        name: 'Ultimate',
        coins: 5000,
        price: 1800,
        currency: 'LKR',
        discount: 28,
        popular: false
    }
];

// API Endpoints Configuration
const API_ENDPOINTS = {
    BASE_URL: 'https://api.kaliyax.com',
    VERSION: 'v1',
    TIMEOUT: 30000,
    
    ENDPOINTS: {
        GPT_CHAT: '/api/v1/gpt-chat',
        IMAGE_GEN: '/api/v1/image-gen',
        TTS: '/api/v1/tts',
        STT: '/api/v1/stt',
        SENTIMENT: '/api/v1/sentiment',
        WEATHER: '/api/v1/weather',
        CURRENCY: '/api/v1/currency',
        STOCKS: '/api/v1/stocks',
        NEWS: '/api/v1/news',
        CRYPTO: '/api/v1/crypto',
        QR_GEN: '/api/v1/qr-gen',
        URL_SHORT: '/api/v1/url-short',
        EMAIL_VALIDATE: '/api/v1/email-validate',
        PDF_GEN: '/api/v1/pdf-gen',
        IMG_RESIZE: '/api/v1/img-resize',
        INSTAGRAM: '/api/v1/instagram',
        TWITTER: '/api/v1/twitter',
        YOUTUBE: '/api/v1/youtube',
        TIKTOK: '/api/v1/tiktok',
        FACEBOOK: '/api/v1/facebook'
    }
};

// API Categories
const API_CATEGORIES = [
    {
        id: 'ai-ml',
        name: 'AI & ML',
        icon: '🤖',
        description: 'Artificial Intelligence and Machine Learning APIs'
    },
    {
        id: 'data',
        name: 'Data',
        icon: '📊',
        description: 'Real-time data and information APIs'
    },
    {
        id: 'utils',
        name: 'Utils',
        icon: '🛠️',
        description: 'Utility and helper APIs'
    },
    {
        id: 'social',
        name: 'Social',
        icon: '📱',
        description: 'Social media integration APIs'
    }
];

// Transaction Types
const TRANSACTION_TYPES = {
    PURCHASE: 'purchase',
    USAGE: 'usage',
    TRANSFER_SENT: 'transfer_sent',
    TRANSFER_RECEIVED: 'transfer_received',
    SIGNUP_BONUS: 'signup_bonus',
    REFERRAL: 'referral'
};

// User Roles
const USER_ROLES = {
    USER: 'user',
    PREMIUM: 'premium',
    ADMIN: 'admin'
};

// Status Types
const STATUS_TYPES = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BANNED: 'banned'
};

// API Status
const API_STATUS = {
    ACTIVE: 'active',
    BETA: 'beta',
    DEPRECATED: 'deprecated',
    MAINTENANCE: 'maintenance'
};

// Error Messages (Sinhala)
const ERROR_MESSAGES = {
    NETWORK_ERROR: 'ජාල සම්බන්ධතා දෝෂයක්',
    INVALID_API_KEY: 'වලංගු නොවන API Key එකක්',
    INSUFFICIENT_BALANCE: 'ප්‍රමාණවත් coins නොමැත',
    INVALID_EMAIL: 'වලංගු නොවන email ලිපිනයක්',
    INVALID_PASSWORD: 'මුරපදය අවම අංක 6ක් විය යුතුයි',
    PASSWORD_MISMATCH: 'මුරපද නොගැලපේ',
    USER_NOT_FOUND: 'පරිශීලකයා හමු නොවීය',
    EMAIL_ALREADY_EXISTS: 'මෙම email ලිපිනය දැනටමත් භාවිතා වේ',
    TRANSFER_FAILED: 'මාරු කිරීම අසාර්ථක විය',
    INVALID_AMOUNT: 'වලංගු නොවන මුදලක්',
    RATE_LIMIT: 'බොහෝ requests. කරුණාකර පසුව උත්සාහ කරන්න'
};

// Success Messages (Sinhala)
const SUCCESS_MESSAGES = {
    LOGIN_SUCCESS: 'සාර්ථකව login විය',
    SIGNUP_SUCCESS: 'ගිණුම සාර්ථකව සාදන ලදී',
    LOGOUT_SUCCESS: 'සාර්ථකව logout විය',
    API_KEY_COPIED: 'API Key copy විය',
    API_KEY_REGENERATED: 'API Key නැවත සාදන ලදී',
    PURCHASE_SUCCESS: 'සාර්ථකව මිල දී ගන්නා ලදී',
    TRANSFER_SUCCESS: 'සාර්ථකව මාරු විය',
    PROFILE_UPDATED: 'Profile යාවත්කාලීන කරන ලදී'
};

// Validation Rules
const VALIDATION_RULES = {
    EMAIL: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'වලංගු email ලිපිනයක් ඇතුළත් කරන්න'
    },
    PASSWORD: {
        minLength: 6,
        message: 'මුරපදය අවම අංක 6ක් විය යුතුයි'
    },
    NAME: {
        minLength: 2,
        maxLength: 50,
        message: 'නම අංක 2-50 අතර විය යුතුයි'
    },
    TRANSFER_AMOUNT: {
        min: COIN_CONFIG.MIN_TRANSFER_AMOUNT,
        max: COIN_CONFIG.MAX_TRANSFER_AMOUNT,
        message: `මුදල ${COIN_CONFIG.MIN_TRANSFER_AMOUNT}-${COIN_CONFIG.MAX_TRANSFER_AMOUNT} අතර විය යුතුයි`
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    USER_TOKEN: 'kaliyax_user_token',
    USER_ID: 'kaliyax_user_id',
    THEME: 'kaliyax_theme',
    LANGUAGE: 'kaliyax_language'
};

// App Configuration
const APP_CONFIG = {
    NAME: 'KaliyaX API',
    VERSION: '1.0.0',
    SUPPORT_EMAIL: 'support@kaliyax.com',
    WEBSITE: 'https://kaliyax.com',
    DOCUMENTATION: 'https://docs.kaliyax.com',
    STATUS_PAGE: 'https://status.kaliyax.com',
    GITHUB: 'https://github.com/kaliyax',
    TWITTER: 'https://twitter.com/kaliyax',
    DISCORD: 'https://discord.gg/kaliyax'
};

// Date Formats
const DATE_FORMATS = {
    SHORT: 'MMM DD',
    LONG: 'MMMM DD, YYYY',
    FULL: 'MMMM DD, YYYY h:mm A',
    TIME: 'h:mm A'
};

// Pagination
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
};

// Rate Limits
const RATE_LIMITS = {
    API_CALLS_PER_MINUTE: 60,
    API_CALLS_PER_HOUR: 1000,
    API_CALLS_PER_DAY: 10000
};

// Export all constants
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COIN_CONFIG,
        COIN_PACKAGES,
        API_ENDPOINTS,
        API_CATEGORIES,
        TRANSACTION_TYPES,
        USER_ROLES,
        STATUS_TYPES,
        API_STATUS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        VALIDATION_RULES,
        STORAGE_KEYS,
        APP_CONFIG,
        DATE_FORMATS,
        PAGINATION,
        RATE_LIMITS
    };
      }
