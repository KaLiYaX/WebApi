// API Helper Functions for KaliyaX API Portal

/**
 * Generate a unique API key
 * @returns {string} Generated API key
 */
function generateApiKey() {
    const prefix = 'kx_live_';
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    return prefix + randomString;
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Format currency (LKR)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return `${amount.toLocaleString()} LKR`;
}

/**
 * Format date relative to now
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatRelativeDate(date) {
    if (!date) return 'Just now';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
}

/**
 * Calculate coin balance after transaction
 * @param {number} currentBalance - Current balance
 * @param {number} amount - Transaction amount (positive or negative)
 * @returns {number} New balance
 */
function calculateBalance(currentBalance, amount) {
    const newBalance = currentBalance + amount;
    return Math.max(0, newBalance);
}

/**
 * Get transaction type display name
 * @param {string} type - Transaction type
 * @returns {string} Display name
 */
function getTransactionTypeName(type) {
    const typeNames = {
        'purchase': 'Coin Purchase',
        'usage': 'API Usage',
        'transfer_sent': 'Transfer Sent',
        'transfer_received': 'Transfer Received',
        'signup_bonus': 'Signup Bonus',
        'referral': 'Referral Bonus'
    };
    return typeNames[type] || 'Transaction';
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} Is valid API key
 */
function isValidApiKey(apiKey) {
    return apiKey && apiKey.startsWith('kx_live_') && apiKey.length > 20;
}

/**
 * Calculate total cost for API calls
 * @param {number} numberOfCalls - Number of API calls
 * @param {number} costPerCall - Cost per call (default: 5)
 * @returns {number} Total cost
 */
function calculateApiCost(numberOfCalls, costPerCall = 5) {
    return numberOfCalls * costPerCall;
}

/**
 * Check if user has sufficient balance
 * @param {number} balance - Current balance
 * @param {number} requiredAmount - Required amount
 * @returns {boolean} Has sufficient balance
 */
function hasSufficientBalance(balance, requiredAmount) {
    return balance >= requiredAmount;
}

/**
 * Format API endpoint URL
 * @param {string} endpoint - Endpoint path
 * @returns {string} Full URL
 */
function formatApiUrl(endpoint) {
    const baseUrl = 'https://api.kaliyax.com';
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
}

/**
 * Parse error message from Firebase
 * @param {Error} error - Firebase error
 * @returns {string} User-friendly error message
 */
function parseFirebaseError(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'මෙම email ලිපිනය දැනටමත් භාවිතා වේ',
        'auth/invalid-email': 'වලංගු නොවන email ලිපිනයක්',
        'auth/weak-password': 'මුරපදය ශක්තිමත් නොවේ (අවම අංක 6ක් අවශ්‍ය)',
        'auth/user-not-found': 'පරිශීලකයා හමු නොවීය',
        'auth/wrong-password': 'වැරදි මුරපදයක්',
        'auth/too-many-requests': 'බොහෝ උත්සාහයන්. කරුණාකර පසුව උත්සාහ කරන්න',
        'permission-denied': 'අවසර නොමැත',
        'not-found': 'දත්ත හමු නොවීය'
    };

    const code = error.code || error.message;
    return errorMessages[code] || error.message || 'දෝෂයක් සිදු විය';
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Generate shareable referral link
 * @param {string} userId - User ID
 * @returns {string} Referral link
 */
function generateReferralLink(userId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${userId}`;
}

/**
 * Get referral code from URL
 * @returns {string|null} Referral code or null
 */
function getReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
}

// Export functions (for module use)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateApiKey,
        isValidEmail,
        formatCurrency,
        formatRelativeDate,
        calculateBalance,
        getTransactionTypeName,
        isValidApiKey,
        calculateApiCost,
        hasSufficientBalance,
        formatApiUrl,
        parseFirebaseError,
        debounce,
        copyToClipboard,
        showToast,
        generateReferralLink,
        getReferralCode
    };
}
